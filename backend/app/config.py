"""Runtime configuration, read from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent


@dataclass(frozen=True)
class Settings:
    db_path: Path
    static_dir: Path
    log_dir: Path
    session_hours: int
    cookie_secure: bool


def load_settings() -> Settings:
    data_dir = Path(os.environ.get("DOORPRIZE_DATA_DIR", BASE_DIR / "data"))
    return Settings(
        db_path=Path(os.environ.get("DOORPRIZE_DB", data_dir / "doorprize.db")),
        static_dir=Path(os.environ.get("DOORPRIZE_STATIC", PROJECT_DIR / "dist")),
        log_dir=Path(os.environ.get("DOORPRIZE_LOG_DIR", data_dir / "logs")),
        session_hours=int(os.environ.get("DOORPRIZE_SESSION_HOURS", "12")),
        cookie_secure=os.environ.get("DOORPRIZE_COOKIE_SECURE", "0") == "1",
    )
