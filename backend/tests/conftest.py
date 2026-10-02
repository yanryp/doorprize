from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import db, security
from app.config import Settings
from app.main import create_app
from app.routers import auth

PASSWORD = "rahasia-oikumene"


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        db_path=tmp_path / "test.db",
        static_dir=tmp_path / "no-dist",
        log_dir=tmp_path / "logs",
        session_hours=1,
        cookie_secure=False,
    )


@pytest.fixture
def anon(settings: Settings) -> Iterator[TestClient]:
    auth._failures.clear()
    app = create_app(settings)
    conn = db.connect(settings.db_path)
    security.set_admin_password(conn, PASSWORD)
    conn.close()
    with TestClient(app) as client:
        yield client


@pytest.fixture
def client(anon: TestClient) -> TestClient:
    assert anon.post("/api/auth/login", json={"password": PASSWORD}).status_code == 200
    return anon


def upload(content: str, name: str = "data.csv") -> dict:
    return {"file": (name, content.encode("utf-8"), "text/csv")}
