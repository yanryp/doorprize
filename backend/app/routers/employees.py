from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from .. import audit, csv_import, db
from ..deps import client_ip, get_conn, require_admin

router = APIRouter(prefix="/api/employees", tags=["employees"], dependencies=[Depends(require_admin)])

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


async def read_upload(file: UploadFile) -> bytes:
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "Ukuran file maksimal 5 MB")
    return data


@router.get("/summary")
def summary(conn: sqlite3.Connection = Depends(get_conn)) -> dict[str, object]:
    row = conn.execute(
        "SELECT COUNT(*) AS total, COALESCE(SUM(active), 0) AS active, MAX(updated_at) AS updated_at "
        "FROM employees"
    ).fetchone()
    return {"total": row["total"], "active": row["active"], "updated_at": row["updated_at"]}


@router.post("/import")
async def import_employees(
    request: Request,
    file: UploadFile = File(...),
    deactivate_missing: bool = Form(False),
    conn: sqlite3.Connection = Depends(get_conn),
) -> dict[str, object]:
    try:
        rows, errors = csv_import.parse(await read_upload(file), require_nip=True)
    except csv_import.CSVFormatError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    if not rows:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Tidak ada baris valid.")

    seen: dict[str, csv_import.RawRow] = {}
    for row in rows:
        assert row.nip is not None
        if row.nip in seen:
            errors.append(f"Baris {row.line}: NIP {row.nip} duplikat (dipakai baris {seen[row.nip].line})")
            continue
        seen[row.nip] = row

    inserted = updated = deactivated = 0
    with db.transaction(conn):
        existing = {r["nip"] for r in conn.execute("SELECT nip FROM employees")}
        for nip, row in seen.items():
            if nip in existing:
                updated += 1
            else:
                inserted += 1
            conn.execute(
                "INSERT INTO employees (nip, name, unit, active, updated_at) "
                "VALUES (?, ?, ?, 1, datetime('now', 'localtime')) "
                "ON CONFLICT(nip) DO UPDATE SET name = excluded.name, unit = excluded.unit, "
                "active = 1, updated_at = excluded.updated_at",
                (nip, row.name, row.unit),
            )
        if deactivate_missing:
            missing = existing - seen.keys()
            for nip in missing:
                conn.execute(
                    "UPDATE employees SET active = 0, updated_at = datetime('now', 'localtime') "
                    "WHERE nip = ? AND active = 1",
                    (nip,),
                )
                deactivated += conn.execute("SELECT changes()").fetchone()[0]
        result = {
            "filename": file.filename,
            "inserted": inserted,
            "updated": updated,
            "deactivated": deactivated,
            "errors": errors,
        }
        audit.record(conn, "employees_import", {**result, "errors": len(errors)}, client_ip(request))
    return result
