#!/bin/bash
# ============================================================
# Astra — First-time environment setup
# Run this ONCE to configure your .env.local
# Usage: bash scripts/setup-env.sh
# ============================================================

set -e

ENV_FILE=".env.local"

echo "============================================"
echo "  Astra — Environment Setup"
echo "============================================"
echo ""

# Check if .env.local exists
if [ -f "$ENV_FILE" ]; then
  echo "Found existing $ENV_FILE"
  echo "This script will UPDATE it (existing values preserved)."
  echo ""
fi

# --- Supabase (check if already set) ---
if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" 2>/dev/null; then
  echo "[OK] Supabase URL already configured"
else
  read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
  echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> "$ENV_FILE"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ENV_FILE" 2>/dev/null; then
  echo "[OK] Supabase Anon Key already configured"
else
  read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON" >> "$ENV_FILE"
fi

# Service role key
if grep -q "SUPABASE_SERVICE_ROLE_KEY=placeholder" "$ENV_FILE" 2>/dev/null || ! grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE" 2>/dev/null; then
  echo ""
  echo ">> Get this from: Supabase Dashboard → Settings → API → service_role (secret)"
  read -p "Enter SUPABASE_SERVICE_ROLE_KEY: " SERVICE_ROLE
  if grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE|" "$ENV_FILE"
  else
    echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE" >> "$ENV_FILE"
  fi
  echo "[OK] Service role key set"
else
  echo "[OK] Supabase Service Role Key already configured"
fi

# --- Internal Secret ---
if grep -q "INTERNAL_SECRET=placeholder" "$ENV_FILE" 2>/dev/null; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || python -c "import secrets; print(secrets.token_hex(32))")
  sed -i "s|INTERNAL_SECRET=.*|INTERNAL_SECRET=$SECRET|" "$ENV_FILE"
  echo "[OK] Generated INTERNAL_SECRET"
elif ! grep -q "INTERNAL_SECRET" "$ENV_FILE" 2>/dev/null; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || python -c "import secrets; print(secrets.token_hex(32))")
  echo "INTERNAL_SECRET=$SECRET" >> "$ENV_FILE"
  echo "[OK] Generated INTERNAL_SECRET"
else
  echo "[OK] INTERNAL_SECRET already configured"
fi

# --- Claude API Key ---
if ! grep -q "CLAUDE_API_KEY" "$ENV_FILE" 2>/dev/null; then
  echo ""
  echo ">> Get this from: console.anthropic.com → API Keys"
  read -p "Enter CLAUDE_API_KEY: " CLAUDE_KEY
  echo "CLAUDE_API_KEY=$CLAUDE_KEY" >> "$ENV_FILE"
  echo "CLAUDE_MODEL=claude-sonnet-4-6" >> "$ENV_FILE"
  echo "HOROSCOPE_MODEL=claude-haiku-4-5" >> "$ENV_FILE"
  echo "[OK] Claude API key set"
else
  echo "[OK] Claude API Key already configured"
fi

# --- OpenAI API Key (for TTS) ---
if ! grep -q "OPENAI_API_KEY" "$ENV_FILE" 2>/dev/null; then
  echo ""
  echo ">> Get this from: platform.openai.com → API Keys"
  echo ">> (Optional — TTS works without it, chat still works)"
  read -p "Enter OPENAI_API_KEY (or press Enter to skip): " OPENAI_KEY
  if [ -n "$OPENAI_KEY" ]; then
    echo "OPENAI_API_KEY=$OPENAI_KEY" >> "$ENV_FILE"
    echo "[OK] OpenAI API key set"
  else
    echo "[SKIP] No OpenAI key — TTS disabled, chat still works"
  fi
else
  echo "[OK] OpenAI API Key already configured"
fi

# --- FastAPI URL ---
if ! grep -q "FASTAPI_BASE_URL" "$ENV_FILE" 2>/dev/null; then
  echo "FASTAPI_BASE_URL=http://localhost:8000" >> "$ENV_FILE"
fi

# --- Stripe (placeholder) ---
if ! grep -q "STRIPE_SECRET_KEY" "$ENV_FILE" 2>/dev/null; then
  echo "" >> "$ENV_FILE"
  echo "# Stripe (fill in when ready — app works without these)" >> "$ENV_FILE"
  echo "STRIPE_SECRET_KEY=" >> "$ENV_FILE"
  echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" >> "$ENV_FILE"
  echo "STRIPE_WEBHOOK_SECRET=" >> "$ENV_FILE"
  echo "STRIPE_MONTHLY_PRICE_ID=" >> "$ENV_FILE"
  echo "STRIPE_YEARLY_PRICE_ID=" >> "$ENV_FILE"
  echo "[OK] Stripe placeholders added (fill in later)"
fi

echo ""
echo "============================================"
echo "  Setup complete! Your $ENV_FILE is ready."
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Run SQL migrations in Supabase Dashboard → SQL Editor"
echo "     (files in supabase/migrations/ — run 001 through 006 in order)"
echo "  2. Start the app:  bash scripts/start.sh"
echo ""
