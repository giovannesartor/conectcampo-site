#!/bin/sh
set -e

echo "[startup] Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[startup] Starting API..."
exec node dist/main.js
