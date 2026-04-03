#!/bin/bash
# ============================================================
# Astra — Start all services
# Usage: bash scripts/start.sh
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Check .env.local exists
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found. Run 'bash scripts/setup-env.sh' first."
  exit 1
fi

# Source internal secret for FastAPI
INTERNAL_SECRET=$(grep "^INTERNAL_SECRET=" .env.local | cut -d '=' -f2-)
if [ -z "$INTERNAL_SECRET" ] || [ "$INTERNAL_SECRET" = "placeholder_generate_with_openssl_rand_hex_32" ]; then
  echo "ERROR: INTERNAL_SECRET not configured. Run 'bash scripts/setup-env.sh' first."
  exit 1
fi

echo "============================================"
echo "  Astra — Starting services"
echo "============================================"
echo ""

# --- Start FastAPI Engine ---
echo "[1/2] Starting FastAPI engine on port 8000..."

# Check if venv exists
if [ ! -d "engine/venv" ]; then
  echo "  Creating Python venv..."
  cd engine
  python -m venv venv
  source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
  pip install -r requirements.txt -q
  cd ..
else
  cd engine
  source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
  cd ..
fi

# Kill any existing process on port 8000
(lsof -ti:8000 | xargs kill 2>/dev/null) || true
(netstat -ano 2>/dev/null | grep ":8000 " | awk '{print $5}' | xargs -I {} taskkill /PID {} /F 2>/dev/null) || true

# Start FastAPI in background
cd engine
INTERNAL_SECRET="$INTERNAL_SECRET" uvicorn app.main:app --reload --port 8000 &
FASTAPI_PID=$!
cd ..

echo "  FastAPI started (PID: $FASTAPI_PID)"
echo ""

# --- Start Next.js ---
echo "[2/2] Starting Next.js on port 3000..."
echo ""
echo "============================================"
echo "  Services:"
echo "  - FastAPI engine: http://localhost:8000"
echo "  - Next.js app:    http://localhost:3000"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Start Next.js in foreground (so Ctrl+C stops everything)
trap "echo ''; echo 'Stopping services...'; kill $FASTAPI_PID 2>/dev/null; exit 0" INT TERM

npm run dev

# If Next.js exits, clean up FastAPI
kill $FASTAPI_PID 2>/dev/null
