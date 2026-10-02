"""Shared FastAPI dependencies."""
from __future__ import annotations

import sqlite3
from collections.abc import Iterator

from fastapi import Depends, HTTPException, Request, status

from . import db, security
from .config import Settings

COOKIE_NAME = "doorprize_session"


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_conn(settings: Settings = Depends(get_settings)) -> Iterator[sqlite3.Connection]:
    conn = db.connect(settings.db_path)
    try:
        yield conn
    finally:
        conn.close()


def client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def require_admin(request: Request, conn: sqlite3.Connection = Depends(get_conn)) -> None:
    if not security.verify_token(conn, request.cookies.get(COOKIE_NAME)):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Silakan login sebagai admin")
