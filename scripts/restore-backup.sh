#!/bin/bash
# ============================================
# COPALITE — Restore database from backup
# ============================================
# Usage:
#   bash scripts/restore-backup.sh                    # restore latest backup
#   bash scripts/restore-backup.sh backups/copalite_20260327_030000.dump  # restore specific file

set -euo pipefail

BACKUP_DIR="./backups"
ENV_FILE="${ENV_FILE:-.env.production}"

# Find backup file
if [ -n "${1:-}" ]; then
    BACKUP_FILE="$1"
else
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/copalite_*.dump 2>/dev/null | head -1)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: No backup file found."
    echo "Usage: $0 [backup_file.dump]"
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/copalite_*.dump 2>/dev/null || echo "  (none)"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "=== COPALITE DATABASE RESTORE ==="
echo "File: $BACKUP_FILE ($BACKUP_SIZE)"
echo ""
echo "WARNING: This will REPLACE the current database with the backup."
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

echo "=== Step 1: Stopping backend to prevent connections ==="
docker compose -f docker-compose.prod.yml stop backend backup-cron 2>/dev/null || true

echo "=== Step 2: Restoring from backup ==="
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_restore --clean --if-exists --no-owner \
    -U "${DB_USERNAME:-copalite}" \
    -d "${DB_DATABASE:-copalite_db}" \
    < "$BACKUP_FILE"

echo "=== Step 3: Restarting services ==="
docker compose -f docker-compose.prod.yml up -d backend backup-cron

echo ""
echo "=== RESTORE COMPLETE ==="
echo "Restored from: $BACKUP_FILE"
echo "Backend restarted. Check: curl http://localhost/health"
