"""FastAPI application factory."""
from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from . import db
from .config import Settings, load_settings
from .routers import auth, draws, employees, sessions

logger = logging.getLogger(__name__)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": (
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
        "script-src 'self'; connect-src 'self'; media-src 'self'"
    ),
}


def configure_logging(log_dir: Path) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    if any(getattr(h, "_doorprize", False) for h in root.handlers):
        return
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    file_handler = RotatingFileHandler(
        log_dir / "doorprize.log", maxBytes=5 * 1024 * 1024, backupCount=10, encoding="utf-8"
    )
    file_handler.setFormatter(fmt)
    file_handler._doorprize = True  # type: ignore[attr-defined]
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    console._doorprize = True  # type: ignore[attr-defined]
    root.addHandler(file_handler)
    root.addHandler(console)
    root.setLevel(logging.INFO)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    configure_logging(settings.log_dir)
    db.init_db(settings.db_path)

    app = FastAPI(title="Doorprize Ibadah Oikumene", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.settings = settings

    @app.middleware("http")
    async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
        response: Response = await call_next(request)
        for key, value in SECURITY_HEADERS.items():
            response.headers.setdefault(key, value)
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse({"detail": "Terjadi kesalahan pada server. Lihat log."}, status_code=500)

    for router in (auth.router, employees.router, sessions.router, draws.router):
        app.include_router(router)

    index = settings.static_dir / "index.html"
    if index.is_file():
        assets = settings.static_dir / "assets"
        if assets.is_dir():
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        async def spa(path: str) -> Response:
            if path.startswith("api/"):
                return JSONResponse({"detail": "Not Found"}, status_code=404)
            candidate = (settings.static_dir / path).resolve()
            if path and candidate.is_file() and candidate.is_relative_to(settings.static_dir.resolve()):
                return FileResponse(candidate)
            return FileResponse(index)
    else:
        logger.warning("Frontend build not found at %s; serving API only", settings.static_dir)

    return app
