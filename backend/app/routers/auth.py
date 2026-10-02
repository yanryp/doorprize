from __future__ import annotations

import sqlite3
import threading
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from .. import audit, security
from ..config import Settings
from ..deps import COOKIE_NAME, client_ip, get_conn, get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_FAILURES = 5
LOCKOUT_SECONDS = 60
_failures: dict[str, list[float]] = {}
_lock = threading.Lock()


class LoginIn(BaseModel):
    password: str


def _locked_out(ip: str) -> bool:
    now = time.monotonic()
    with _lock:
        recent = [t for t in _failures.get(ip, []) if now - t < LOCKOUT_SECONDS]
        _failures[ip] = recent
        return len(recent) >= MAX_FAILURES


def _register_failure(ip: str) -> None:
    with _lock:
        _failures.setdefault(ip, []).append(time.monotonic())


@router.get("/me")
def me(request: Request, conn: sqlite3.Connection = Depends(get_conn)) -> dict[str, bool]:
    return {
        "authenticated": security.verify_token(conn, request.cookies.get(COOKIE_NAME)),
        "password_set": security.has_admin_password(conn),
    }


@router.post("/login")
def login(
    body: LoginIn,
    request: Request,
    response: Response,
    conn: sqlite3.Connection = Depends(get_conn),
    settings: Settings = Depends(get_settings),
) -> dict[str, bool]:
    ip = client_ip(request) or "unknown"
    if _locked_out(ip):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Terlalu banyak percobaan gagal. Coba lagi dalam {LOCKOUT_SECONDS} detik.",
        )
    if not security.has_admin_password(conn):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Password admin belum diatur. Jalankan start.bat untuk mengaturnya.",
        )
    if not security.check_admin_password(conn, body.password):
        _register_failure(ip)
        audit.record(conn, "login_failed", {}, ip, actor="anonymous")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Password salah")

    token = security.issue_token(conn, settings.session_hours)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=settings.session_hours * 3600,
        httponly=True,
        samesite="strict",
        secure=settings.cookie_secure,
    )
    audit.record(conn, "login", {}, ip)
    return {"authenticated": True}


@router.post("/logout")
def logout(
    request: Request, response: Response, conn: sqlite3.Connection = Depends(get_conn)
) -> dict[str, bool]:
    if security.verify_token(conn, request.cookies.get(COOKIE_NAME)):
        audit.record(conn, "logout", {}, client_ip(request))
    response.delete_cookie(COOKIE_NAME)
    return {"authenticated": False}
