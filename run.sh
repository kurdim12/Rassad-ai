#!/usr/bin/env bash
# RASAD AI — one-command local dev launcher (no Docker required).
#
#   ./run.sh
#
# Spawns the FastAPI backend on :8000 and the Vite dev server on :5173,
# proxying /api/* to the backend automatically.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

cleanup() {
  echo
  echo "→ Stopping RASAD…"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ----- backend ----------------------------------------------------------
echo "→ Starting backend (port 8000)…"
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
else
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

[ -f .env ] || cp .env.example .env

uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info &
BACKEND_PID=$!

# wait until backend is ready
until curl -sf http://127.0.0.1:8000/api/health >/dev/null 2>&1; do
  sleep 0.5
done
echo "   ✓ backend ready"

# ----- frontend ---------------------------------------------------------
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  echo "→ Installing frontend deps…"
  npm install --no-audit --no-fund
fi

echo "→ Starting frontend (port 5173)…"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo
echo "============================================================"
echo "  RASAD AI is running"
echo "  → UI:       http://localhost:5173"
echo "  → API:      http://localhost:8000"
echo "  → API docs: http://localhost:8000/docs"
echo "  Press Ctrl+C to stop."
echo "============================================================"

wait
