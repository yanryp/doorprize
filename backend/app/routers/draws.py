from __future__ import annotations

import csv
import datetime as dt
import io
import json
import sqlite3
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from .. import audit, db
from ..deps import client_ip, get_conn, require_admin
from ..draw import eligible_hash, new_seed, select_winners
from .sessions import get_session_or_404

router = APIRouter(prefix="/api", tags=["draws"], dependencies=[Depends(require_admin)])

STATUS_LABEL = {"pending": "Menunggu", "claimed": "Diambil", "forfeited": "Hangus"}


class DrawIn(BaseModel):
    winner_count: int = Field(..., ge=1, le=500)
    exclude_recent_weeks: int = Field(0, ge=0, le=52)


class WinnerStatusIn(BaseModel):
    status: Literal["pending", "claimed", "forfeited"]


def _draw_payload(conn: sqlite3.Connection, draw: sqlite3.Row) -> dict[str, object]:
    winners = conn.execute(
        """
        SELECT w.rank, w.attendee_id, w.status, w.status_at, a.nip, a.name, a.unit
        FROM draw_winners w JOIN attendees a ON a.id = w.attendee_id
        WHERE w.draw_id = ? ORDER BY w.rank
        """,
        (draw["id"],),
    )
    attendee_count = conn.execute(
        "SELECT COUNT(*) FROM attendees WHERE session_id = ?", (draw["session_id"],)
    ).fetchone()[0]
    eligible_count = len(json.loads(draw["eligible_keys"]))
    return {
        "id": draw["id"],
        "session_id": draw["session_id"],
        "winner_count": draw["winner_count"],
        "exclude_recent_weeks": draw["exclude_recent_weeks"],
        "seed": draw["seed"],
        "eligible_hash": draw["eligible_hash"],
        "eligible_count": eligible_count,
        "attendee_count": attendee_count,
        "excluded_count": attendee_count - eligible_count,
        "created_at": draw["created_at"],
        "winners": [dict(w) for w in winners],
    }


def _get_draw_or_404(conn: sqlite3.Connection, draw_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM draws WHERE id = ?", (draw_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Undian tidak ditemukan")
    return row


def recent_winner_keys(conn: sqlite3.Connection, session_date: str, weeks: int) -> set[str]:
    """Person keys that won (and did not forfeit) in the `weeks` before this session."""
    if weeks <= 0:
        return set()
    since = (dt.date.fromisoformat(session_date) - dt.timedelta(weeks=weeks)).isoformat()
    rows = conn.execute(
        """
        SELECT a.person_key FROM draw_winners w
        JOIN draws d ON d.id = w.draw_id
        JOIN sessions s ON s.id = d.session_id
        JOIN attendees a ON a.id = w.attendee_id
        WHERE w.status != 'forfeited' AND s.date >= ? AND s.date < ?
        """,
        (since, session_date),
    )
    return {r["person_key"] for r in rows}


@router.get("/sessions/{session_id}/draw")
def get_draw(session_id: int, conn: sqlite3.Connection = Depends(get_conn)) -> dict[str, object]:
    row = conn.execute("SELECT * FROM draws WHERE session_id = ?", (session_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Belum ada undian untuk sesi ini")
    return _draw_payload(conn, row)


@router.get("/sessions/{session_id}/draw/eligible-count")
def eligible_count(
    session_id: int, exclude_recent_weeks: int = 0, conn: sqlite3.Connection = Depends(get_conn)
) -> dict[str, int]:
    session = get_session_or_404(conn, session_id)
    excluded = recent_winner_keys(conn, session["date"], exclude_recent_weeks)
    keys = [r["person_key"] for r in conn.execute(
        "SELECT person_key FROM attendees WHERE session_id = ?", (session_id,)
    )]
    eligible = [k for k in keys if k not in excluded]
    return {"attendee_count": len(keys), "eligible_count": len(eligible)}


@router.post("/sessions/{session_id}/draw", status_code=status.HTTP_201_CREATED)
def run_draw(
    session_id: int,
    body: DrawIn,
    request: Request,
    conn: sqlite3.Connection = Depends(get_conn),
) -> dict[str, object]:
    with db.transaction(conn):
        session = get_session_or_404(conn, session_id)
        if conn.execute("SELECT 1 FROM draws WHERE session_id = ?", (session_id,)).fetchone():
            raise HTTPException(status.HTTP_409_CONFLICT, "Undian sesi ini sudah dilakukan")

        attendees = {
            r["person_key"]: r["id"]
            for r in conn.execute(
                "SELECT id, person_key FROM attendees WHERE session_id = ?", (session_id,)
            )
        }
        excluded = recent_winner_keys(conn, session["date"], body.exclude_recent_weeks)
        eligible = sorted(k for k in attendees if k not in excluded)

        seed = new_seed()
        try:
            winners = select_winners(eligible, body.winner_count, seed)
        except ValueError as exc:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

        cur = conn.execute(
            "INSERT INTO draws (session_id, winner_count, exclude_recent_weeks, seed, "
            "eligible_keys, eligible_hash) VALUES (?, ?, ?, ?, ?, ?)",
            (
                session_id, body.winner_count, body.exclude_recent_weeks, seed,
                json.dumps(eligible), eligible_hash(eligible),
            ),
        )
        draw_id = cur.lastrowid
        for rank, key in enumerate(winners, start=1):
            conn.execute(
                "INSERT INTO draw_winners (draw_id, rank, attendee_id) VALUES (?, ?, ?)",
                (draw_id, rank, attendees[key]),
            )
        audit.record(
            conn, "draw",
            {
                "session_id": session_id, "draw_id": draw_id, "date": session["date"],
                "winner_count": body.winner_count, "exclude_recent_weeks": body.exclude_recent_weeks,
                "eligible_count": len(eligible), "excluded_count": len(attendees) - len(eligible),
                "seed": seed, "winners": winners,
            },
            client_ip(request),
        )
    return _draw_payload(conn, _get_draw_or_404(conn, draw_id))


@router.patch("/draws/{draw_id}/winners/{rank}")
def set_winner_status(
    draw_id: int,
    rank: int,
    body: WinnerStatusIn,
    request: Request,
    conn: sqlite3.Connection = Depends(get_conn),
) -> dict[str, object]:
    with db.transaction(conn):
        draw = _get_draw_or_404(conn, draw_id)
        row = conn.execute(
            "SELECT w.status, a.nip, a.name FROM draw_winners w "
            "JOIN attendees a ON a.id = w.attendee_id WHERE w.draw_id = ? AND w.rank = ?",
            (draw_id, rank),
        ).fetchone()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pemenang tidak ditemukan")
        if row["status"] != body.status:
            conn.execute(
                "UPDATE draw_winners SET status = ?, status_at = datetime('now', 'localtime') "
                "WHERE draw_id = ? AND rank = ?",
                (body.status, draw_id, rank),
            )
            audit.record(
                conn, "winner_status",
                {
                    "draw_id": draw_id, "rank": rank, "nip": row["nip"], "name": row["name"],
                    "from": row["status"], "to": body.status,
                },
                client_ip(request),
            )
    return _draw_payload(conn, draw)


@router.get("/draws/{draw_id}/verify")
def verify_draw(draw_id: int, conn: sqlite3.Connection = Depends(get_conn)) -> dict[str, object]:
    draw = _get_draw_or_404(conn, draw_id)
    eligible: list[str] = json.loads(draw["eligible_keys"])
    stored = [
        r["person_key"] for r in conn.execute(
            "SELECT a.person_key FROM draw_winners w JOIN attendees a ON a.id = w.attendee_id "
            "WHERE w.draw_id = ? ORDER BY w.rank",
            (draw_id,),
        )
    ]
    recomputed = select_winners(eligible, draw["winner_count"], draw["seed"])
    hash_ok = eligible_hash(eligible) == draw["eligible_hash"]
    return {
        "valid": hash_ok and recomputed == stored,
        "hash_ok": hash_ok,
        "winners_match": recomputed == stored,
    }


@router.get("/draws/{draw_id}/export.csv")
def export_draw(draw_id: int, conn: sqlite3.Connection = Depends(get_conn)) -> Response:
    draw = _draw_payload(conn, _get_draw_or_404(conn, draw_id))
    session = get_session_or_404(conn, int(draw["session_id"]))
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";")
    writer.writerow(["tanggal", "acara", "urutan", "nip", "nama", "unit", "status", "waktu_status"])
    for w in draw["winners"]:  # type: ignore[union-attr]
        writer.writerow([
            session["date"], session["title"], w["rank"], w["nip"] or "", w["name"], w["unit"],
            STATUS_LABEL[w["status"]], w["status_at"] or "",
        ])
    filename = f"pemenang-doorprize-{session['date']}.csv"
    return Response(
        content="﻿" + buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/audit")
def audit_log(limit: int = 200, conn: sqlite3.Connection = Depends(get_conn)) -> list[dict[str, object]]:
    limit = max(1, min(limit, 1000))
    rows = conn.execute(
        "SELECT id, ts, actor, client_ip, action, detail FROM audit_log ORDER BY id DESC LIMIT ?",
        (limit,),
    )
    return [{**dict(r), "detail": json.loads(r["detail"])} for r in rows]
