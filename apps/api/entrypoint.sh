#!/bin/sh
set -e

SCHEMA="./prisma/schema.prisma"
MIGRATIONS_DIR="./prisma/migrations"

echo "[startup] Checking database migration state..."

# Se já existem migrations geradas, usa migrate deploy (seguro para produção).
# No primeiro deploy (sem pasta migrations), usa db push como bootstrap.
if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A $MIGRATIONS_DIR 2>/dev/null)" ]; then
  echo "[startup] Running prisma migrate deploy..."
  npx prisma migrate deploy --schema="$SCHEMA"
else
  echo "[startup] No migrations found — running prisma db push (first deploy bootstrap)..."
  npx prisma db push --schema="$SCHEMA" --accept-data-loss
fi

echo "[startup] Starting API..."
exec node dist/main.js
