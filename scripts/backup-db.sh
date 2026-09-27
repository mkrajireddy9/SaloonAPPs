#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
mkdir -p backups
file="backups/halo-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump "$DATABASE_URL" --format=custom --file="$file"
echo "Created $file"
