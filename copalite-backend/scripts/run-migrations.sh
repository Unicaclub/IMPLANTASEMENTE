#!/bin/sh
# Run pending SQL migrations against PostgreSQL before starting the app.
# Each migration uses IF NOT EXISTS / DO $$ EXCEPTION so they're idempotent.
set -e

MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/migrations}"
PGHOST="${DB_HOST:-localhost}"
PGPORT="${DB_PORT:-5432}"
PGUSER="${DB_USERNAME:-copalite}"
PGDATABASE="${DB_DATABASE:-copalite_db}"
export PGPASSWORD="${DB_PASSWORD}"

echo "[migrations] Checking for pending migrations in $MIGRATIONS_DIR..."

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "[migrations] No migrations directory found, skipping."
  exit 0
fi

# Run only numbered migrations (not seeds) in order
for f in $(ls "$MIGRATIONS_DIR"/[0-9]*.sql 2>/dev/null | sort); do
  NAME=$(basename "$f")
  echo "[migrations] Applying $NAME..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$f" -q 2>&1 || {
    echo "[migrations] WARNING: $NAME had errors (may be already applied)"
  }
done

echo "[migrations] Done."
