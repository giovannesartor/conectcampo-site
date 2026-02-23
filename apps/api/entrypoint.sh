#!/bin/sh
set -e

echo "[startup] Syncing database schema..."
npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss

echo "[startup] Starting API..."
exec node dist/main.js
