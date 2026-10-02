"""Append-only audit trail, mirrored to the application log."""
from __future__ import annotations

import json
import logging
import sqlite3
from typing import Any

logger = logging.getLogger("doorprize.audit")


def record(
    conn: sqlite3.Connection,
    action: str,
    detail: dict[str, Any],
    client_ip: str | None,
    actor: str = "admin",
) -> None:
    payload = json.dumps(detail, ensure_ascii=False, sort_keys=True)
    conn.execute(
        "INSERT INTO audit_log (actor, client_ip, action, detail) VALUES (?, ?, ?, ?)",
        (actor, client_ip, action, payload),
    )
    logger.info("actor=%s ip=%s action=%s detail=%s", actor, client_ip, action, payload)
