#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${1:?Usage: DATABASE_URL=... ./scripts/restore-db.sh path/to/backup.dump}"
backup="$1"
[[ -f "$backup" ]] || { echo "Backup file not found: $backup" >&2; exit 1; }
if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo 'Restore is destructive. Set CONFIRM_RESTORE=YES to continue.' >&2
  exit 1
fi
pg_restore "$DATABASE_URL" --clean --if-exists --no-owner --exit-on-error "$backup"
echo "Restored $backup"
