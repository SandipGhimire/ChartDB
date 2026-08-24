#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting chartdb-server..."
exec node dist/src/index.js
