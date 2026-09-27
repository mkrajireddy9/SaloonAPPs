#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
backup="${1:?Usage: $0 backups/file.dump}"
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$backup"
echo "Restored $backup"
