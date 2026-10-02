"""Admin password hashing (scrypt) and HMAC-signed session tokens."""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import sqlite3
import time

from . import db

_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
MIN_PASSWORD_LENGTH = 8


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P)
    return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, n, r, p, salt_hex, digest_hex = stored.split("$")
    except ValueError:
        return False
    if algo != "scrypt":
        return False
    digest = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt_hex), n=int(n), r=int(r), p=int(p)
    )
    return hmac.compare_digest(digest.hex(), digest_hex)


def set_admin_password(conn: sqlite3.Connection, password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password minimal {MIN_PASSWORD_LENGTH} karakter")
    db.set_setting(conn, "admin_password_hash", hash_password(password))
    # Rotating the signing secret invalidates every existing session.
    db.set_setting(conn, "token_secret", secrets.token_hex(32))


def has_admin_password(conn: sqlite3.Connection) -> bool:
    return db.get_setting(conn, "admin_password_hash") is not None


def check_admin_password(conn: sqlite3.Connection, password: str) -> bool:
    stored = db.get_setting(conn, "admin_password_hash")
    return stored is not None and verify_password(password, stored)


def _token_secret(conn: sqlite3.Connection) -> bytes:
    secret = db.get_setting(conn, "token_secret")
    if secret is None:
        secret = secrets.token_hex(32)
        db.set_setting(conn, "token_secret", secret)
    return bytes.fromhex(secret)


def issue_token(conn: sqlite3.Connection, hours: int) -> str:
    expires = int(time.time()) + hours * 3600
    payload = f"admin.{expires}"
    sig = hmac.new(_token_secret(conn), payload.encode(), hashlib.sha256).digest()
    return f"{payload}.{base64.urlsafe_b64encode(sig).decode().rstrip('=')}"


def verify_token(conn: sqlite3.Connection, token: str | None) -> bool:
    if not token:
        return False
    try:
        actor, expires, sig = token.split(".")
        expires_at = int(expires)
    except ValueError:
        return False
    if actor != "admin" or expires_at < time.time():
        return False
    expected = hmac.new(
        _token_secret(conn), f"{actor}.{expires}".encode(), hashlib.sha256
    ).digest()
    expected_b64 = base64.urlsafe_b64encode(expected).decode().rstrip("=")
    return hmac.compare_digest(expected_b64, sig)
