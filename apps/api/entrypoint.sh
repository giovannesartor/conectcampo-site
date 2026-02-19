#!/bin/sh
set -e

echo "[startup] Pushing schema to database..."
npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss

echo "[startup] Starting API..."
exec node dist/main.js
