"""Operator commands.

    python -m app.cli set-password      # set / change the admin password
    python -m app.cli ensure-password   # prompt only if no password is set yet
    python -m app.cli backup            # copy the database to data/backups/
    python -m app.cli verify-draw ID    # re-verify a stored draw
    python -m app.cli serve [--port N] [--no-browser]
"""
from __future__ import annotations

import argparse
import datetime as dt
import getpass
import json
import logging
import sqlite3
import sys
import threading
import webbrowser

from . import db, security
from .config import load_settings
from .draw import eligible_hash, select_winners

logger = logging.getLogger("doorprize.cli")
KEEP_BACKUPS = 60


def _prompt_password() -> str:
    while True:
        first = getpass.getpass(f"Password admin baru (min. {security.MIN_PASSWORD_LENGTH} karakter): ")
        if len(first) < security.MIN_PASSWORD_LENGTH:
            print("Terlalu pendek.")
            continue
        if getpass.getpass("Ulangi password: ") != first:
            print("Password tidak sama.")
            continue
        return first


def cmd_set_password(conn: sqlite3.Connection, only_if_missing: bool) -> int:
    if only_if_missing and security.has_admin_password(conn):
        return 0
    if only_if_missing:
        print("Password admin belum diatur.")
    security.set_admin_password(conn, _prompt_password())
    conn.execute(
        "INSERT INTO audit_log (actor, client_ip, action, detail) VALUES ('cli', NULL, 'password_set', '{}')"
    )
    print("Password admin tersimpan.")
    return 0


def cmd_backup(conn: sqlite3.Connection) -> int:
    settings = load_settings()
    backup_dir = settings.db_path.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / f"doorprize-{dt.datetime.now():%Y%m%d-%H%M%S}.db"
    dest = sqlite3.connect(target)
    try:
        conn.backup(dest)
    finally:
        dest.close()
    backups = sorted(backup_dir.glob("doorprize-*.db"))
    for old in backups[:-KEEP_BACKUPS]:
        old.unlink()
    print(f"Backup: {target}")
    return 0


def cmd_verify(conn: sqlite3.Connection, draw_id: int) -> int:
    draw = conn.execute("SELECT * FROM draws WHERE id = ?", (draw_id,)).fetchone()
    if draw is None:
        print(f"Undian {draw_id} tidak ditemukan", file=sys.stderr)
        return 1
    eligible = json.loads(draw["eligible_keys"])
    stored = [r[0] for r in conn.execute(
        "SELECT a.person_key FROM draw_winners w JOIN attendees a ON a.id = w.attendee_id "
        "WHERE w.draw_id = ? ORDER BY w.rank", (draw_id,)
    )]
    hash_ok = eligible_hash(eligible) == draw["eligible_hash"]
    winners_ok = select_winners(eligible, draw["winner_count"], draw["seed"]) == stored
    print(f"Hash daftar peserta : {'OK' if hash_ok else 'TIDAK COCOK'}")
    print(f"Hasil pemenang      : {'OK' if winners_ok else 'TIDAK COCOK'}")
    return 0 if hash_ok and winners_ok else 2


def cmd_serve(port: int, open_browser: bool) -> int:
    import uvicorn

    from .main import create_app

    url = f"http://127.0.0.1:{port}/"
    if open_browser:
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()
    print(f"Aplikasi berjalan di {url}  (tutup jendela ini untuk berhenti)")
    # Bind to loopback only: the app is meant for the operator laptop.
    uvicorn.run(create_app(), host="127.0.0.1", port=port, log_level="info")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="doorprize")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("set-password")
    sub.add_parser("ensure-password")
    sub.add_parser("backup")
    verify = sub.add_parser("verify-draw")
    verify.add_argument("draw_id", type=int)
    serve = sub.add_parser("serve")
    serve.add_argument("--port", type=int, default=8000)
    serve.add_argument("--no-browser", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    if args.command == "serve":
        return cmd_serve(args.port, not args.no_browser)

    settings = load_settings()
    db.init_db(settings.db_path)
    conn = db.connect(settings.db_path)
    try:
        if args.command == "set-password":
            return cmd_set_password(conn, only_if_missing=False)
        if args.command == "ensure-password":
            return cmd_set_password(conn, only_if_missing=True)
        if args.command == "backup":
            return cmd_backup(conn)
        return cmd_verify(conn, args.draw_id)
    except KeyboardInterrupt:
        print("\nDibatalkan.")
        return 130
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
