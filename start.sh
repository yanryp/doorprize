#!/usr/bin/env bash
# Doorprize Ibadah Oikumene - Linux/macOS launcher (development or non-Windows operator).
set -euo pipefail
cd "$(dirname "$0")"

PY=${PYTHON:-python3}
if ! "$PY" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
    echo "Butuh Python 3.10+ (terdeteksi: $("$PY" --version 2>&1)). macOS: brew install python@3.12, lalu PYTHON=python3.12 ./start.sh" >&2
    exit 1
fi

VENV=backend/.venv
if [[ ! -x "$VENV/bin/python" ]]; then
    echo "Menyiapkan Python virtual environment..."
    "$PY" -m venv "$VENV"
fi
if ! cmp -s backend/requirements.txt "$VENV/requirements.installed"; then
    "$VENV/bin/python" -m pip install --disable-pip-version-check -q -r backend/requirements.txt
    cp backend/requirements.txt "$VENV/requirements.installed"
fi
if [[ ! -f dist/index.html ]]; then
    npm ci
    npm run build
fi

cd backend
.venv/bin/python -m app.cli ensure-password
.venv/bin/python -m app.cli backup
exec .venv/bin/python -m app.cli serve "$@"
