#!/bin/bash
# Copalite PostgreSQL Backup
# Usage: bash scripts/backup.sh
# Cron: 0 3 * * * /path/to/scripts/backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-copalite-db-prod}"

mkdir -p "$BACKUP_DIR"

echo "Backing up Copalite DB at $TIMESTAMP..."
docker exec "$DB_CONTAINER" pg_dump -U copalite copalite_db | gzip > "$BACKUP_DIR/copalite_$TIMESTAMP.sql.gz"

# Manter ultimos 7 dias
find "$BACKUP_DIR" -name "copalite_*.sql.gz" -mtime +7 -delete

echo "Backup complete: $BACKUP_DIR/copalite_$TIMESTAMP.sql.gz"
ls -lh "$BACKUP_DIR/copalite_$TIMESTAMP.sql.gz"
