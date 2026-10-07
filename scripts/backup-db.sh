#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$BACKUP_DIR/halo-${timestamp}.dump"

pg_dump "$DATABASE_URL" --format=custom --no-owner --file "$file"
find "$BACKUP_DIR" -type f -name 'halo-*.dump' -mtime "+$RETENTION_DAYS" -delete
echo "Created $file"
