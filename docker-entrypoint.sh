#!/bin/sh
set -e

# Make sure the SQLite file's parent directory exists (DATABASE_URL like file:/path/to/cravixo.db)
DB_PATH=$(echo "${DATABASE_URL#file:}" | cut -d? -f1)
if [ -n "$DB_PATH" ] && [ "$DB_PATH" != "." ]; then
  mkdir -p "$(dirname "$DB_PATH")"
fi

# Apply the schema (no migrations exist yet, so db push is the equivalent)
npx prisma db push --skip-generate

# Seed demo data only when the database is empty (seed.ts skips itself if data exists)
echo "Checking database for seed data..."
npx tsx prisma/seed.ts

echo "Starting CRAVIXO server on $PORT ..."
exec npx tsx server.ts