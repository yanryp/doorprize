from __future__ import annotations

import datetime as dt
import sqlite3
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field

from .. import audit, csv_import, db
from ..deps import client_ip, get_conn, require_admin
from ..draw import normalize, person_key
from .employees import read_upload

router = APIRouter(prefix="/api/sessions", tags=["sessions"], dependencies=[Depends(require_admin)])

RowStatus = Literal[
    "ok", "master", "matched_name", "nip_unknown", "duplicate_file", "duplicate_session"
]
SKIPPED: set[str] = {"duplicate_file", "duplicate_session"}


class SessionIn(BaseModel):
    date: dt.date
    title: str = Field("Ibadah Oikumene", min_length=1, max_length=120)


class AttendeeRowIn(BaseModel):
    line: int | None = None
    nip: str | None = Field(None, max_length=40)
    name: str = Field("", max_length=120)
    unit: str = Field("", max_length=120)


class ImportIn(BaseModel):
    mode: Literal["merge", "replace"] = "merge"
    filename: str | None = None
    rows: list[AttendeeRowIn] = Field(..., max_length=csv_import.MAX_ROWS)


def get_session_or_404(conn: sqlite3.Connection, session_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sesi tidak ditemukan")
    return row


def ensure_not_drawn(conn: sqlite3.Connection, session_id: int) -> None:
    if conn.execute("SELECT 1 FROM draws WHERE session_id = ?", (session_id,)).fetchone():
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Undian sesi ini sudah dilakukan. Daftar peserta terkunci.",
        )


def resolve_rows(
    conn: sqlite3.Connection,
    session_id: int,
    rows: list[AttendeeRowIn],
    check_session: bool,
) -> list[dict[str, object]]:
    """Match rows to the HR master and flag duplicates. Pure read, no writes."""
    master = {
        r["nip"]: r
        for r in conn.execute("SELECT nip, name, unit FROM employees WHERE active = 1")
    }
    by_name: dict[str, list[sqlite3.Row]] = {}
    for emp in master.values():
        by_name.setdefault(normalize(emp["name"]), []).append(emp)

    existing = (
        {r["person_key"] for r in conn.execute(
            "SELECT person_key FROM attendees WHERE session_id = ?", (session_id,)
        )}
        if check_session
        else set()
    )

    resolved: list[dict[str, object]] = []
    seen: set[str] = set()
    for row in rows:
        nip = (row.nip or "").strip() or None
        name, unit = row.name.strip(), row.unit.strip()
        state: RowStatus = "ok"
        message = ""

        if nip and nip in master:
            name, unit = master[nip]["name"], master[nip]["unit"]
            state = "master"
        elif nip:
            state = "nip_unknown"
            message = "NIP tidak ada di master SDM (aktif); dipakai nama/unit dari file"
            if not (name and unit):
                resolved.append({
                    "line": row.line, "nip": nip, "name": name, "unit": unit,
                    "status": "nip_unknown", "message": "NIP tidak dikenal dan nama/unit kosong",
                    "skip": True,
                })
                continue
        else:
            matches = by_name.get(normalize(name), [])
            if len(matches) > 1 and unit:
                # Same name in several units: narrow by unit ("IT" matches "Divisi IT").
                wanted = normalize(unit)
                matches = [m for m in matches if wanted in normalize(m["unit"])]
            if len(matches) == 1:
                nip, name, unit = matches[0]["nip"], matches[0]["name"], matches[0]["unit"]
                state = "matched_name"
                message = f"Dicocokkan ke NIP {nip}"

        key = person_key(nip, name, unit)
        if key in seen:
            state, message = "duplicate_file", "Duplikat di file ini"
        elif key in existing:
            state, message = "duplicate_session", "Sudah terdaftar di sesi ini"
        seen.add(key)

        resolved.append({
            "line": row.line, "nip": nip, "name": name, "unit": unit, "person_key": key,
            "status": state, "message": message, "skip": state in SKIPPED,
        })
    return resolved


def attendee_list(conn: sqlite3.Connection, session_id: int) -> list[dict[str, object]]:
    rows = conn.execute(
        "SELECT id, nip, name, unit, imported_at FROM attendees WHERE session_id = ? "
        "ORDER BY name COLLATE NOCASE",
        (session_id,),
    )
    return [dict(r) for r in rows]


@router.get("")
def list_sessions(conn: sqlite3.Connection = Depends(get_conn)) -> list[dict[str, object]]:
    rows = conn.execute(
        """
        SELECT s.id, s.date, s.title, s.created_at,
               (SELECT COUNT(*) FROM attendees a WHERE a.session_id = s.id) AS attendee_count,
               d.id AS draw_id, d.winner_count, d.created_at AS drawn_at
        FROM sessions s LEFT JOIN draws d ON d.session_id = s.id
        ORDER BY s.date DESC
        """
    )
    return [dict(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(
    body: SessionIn, request: Request, conn: sqlite3.Connection = Depends(get_conn)
) -> dict[str, object]:
    with db.transaction(conn):
        if conn.execute("SELECT 1 FROM sessions WHERE date = ?", (body.date.isoformat(),)).fetchone():
            raise HTTPException(status.HTTP_409_CONFLICT, "Sesi untuk tanggal ini sudah ada")
        cur = conn.execute(
            "INSERT INTO sessions (date, title) VALUES (?, ?)", (body.date.isoformat(), body.title)
        )
        audit.record(
            conn, "session_create",
            {"session_id": cur.lastrowid, "date": body.date.isoformat(), "title": body.title},
            client_ip(request),
        )
    return dict(get_session_or_404(conn, cur.lastrowid))


@router.get("/{session_id}")
def get_session(session_id: int, conn: sqlite3.Connection = Depends(get_conn)) -> dict[str, object]:
    session = dict(get_session_or_404(conn, session_id))
    drawn = conn.execute("SELECT id FROM draws WHERE session_id = ?", (session_id,)).fetchone()
    session["draw_id"] = drawn["id"] if drawn else None
    session["attendees"] = attendee_list(conn, session_id)
    return session


@router.post("/{session_id}/attendees/preview")
async def preview_attendees(
    session_id: int,
    file: UploadFile = File(...),
    conn: sqlite3.Connection = Depends(get_conn),
) -> dict[str, object]:
    get_session_or_404(conn, session_id)
    try:
        raw, errors = csv_import.parse(await read_upload(file))
    except csv_import.CSVFormatError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    rows = [AttendeeRowIn(line=r.line, nip=r.nip, name=r.name, unit=r.unit) for r in raw]
    return {
        "filename": file.filename,
        "rows": resolve_rows(conn, session_id, rows, check_session=True),
        "errors": errors,
    }


@router.post("/{session_id}/attendees/import")
def import_attendees(
    session_id: int,
    body: ImportIn,
    request: Request,
    conn: sqlite3.Connection = Depends(get_conn),
) -> dict[str, object]:
    get_session_or_404(conn, session_id)
    with db.transaction(conn):
        ensure_not_drawn(conn, session_id)
        removed = 0
        if body.mode == "replace":
            removed = conn.execute(
                "DELETE FROM attendees WHERE session_id = ?", (session_id,)
            ).rowcount
        resolved = resolve_rows(conn, session_id, body.rows, check_session=body.mode == "merge")
        inserted = 0
        for row in resolved:
            if row["skip"]:
                continue
            conn.execute(
                "INSERT INTO attendees (session_id, person_key, nip, name, unit) VALUES (?, ?, ?, ?, ?)",
                (session_id, row["person_key"], row["nip"], row["name"], row["unit"]),
            )
            inserted += 1
        result = {
            "mode": body.mode,
            "filename": body.filename,
            "inserted": inserted,
            "skipped": len(resolved) - inserted,
            "removed": removed,
        }
        audit.record(conn, "attendees_import", {"session_id": session_id, **result}, client_ip(request))
    return {**result, "attendees": attendee_list(conn, session_id)}


@router.delete("/{session_id}/attendees/{attendee_id}")
def delete_attendee(
    session_id: int,
    attendee_id: int,
    request: Request,
    conn: sqlite3.Connection = Depends(get_conn),
) -> dict[str, object]:
    with db.transaction(conn):
        ensure_not_drawn(conn, session_id)
        row = conn.execute(
            "SELECT nip, name, unit FROM attendees WHERE id = ? AND session_id = ?",
            (attendee_id, session_id),
        ).fetchone()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Peserta tidak ditemukan")
        conn.execute("DELETE FROM attendees WHERE id = ?", (attendee_id,))
        audit.record(
            conn, "attendee_delete",
            {"session_id": session_id, "attendee_id": attendee_id, **dict(row)},
            client_ip(request),
        )
    return {"attendees": attendee_list(conn, session_id)}


@router.delete("/{session_id}/attendees")
def clear_attendees(
    session_id: int, request: Request, conn: sqlite3.Connection = Depends(get_conn)
) -> dict[str, object]:
    get_session_or_404(conn, session_id)
    with db.transaction(conn):
        ensure_not_drawn(conn, session_id)
        removed = conn.execute("DELETE FROM attendees WHERE session_id = ?", (session_id,)).rowcount
        audit.record(conn, "attendees_clear", {"session_id": session_id, "removed": removed}, client_ip(request))
    return {"attendees": []}
