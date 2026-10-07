#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${API_URL:-http://localhost:3000}"
failures=0

check() {
  local name="$1" url="$2"
  local headers
  headers="$(curl --silent --show-error --dump-header - --output /dev/null --max-time 10 "$url")" || { echo "FAIL $name: request failed"; failures=$((failures + 1)); return; }
  grep -qi '^x-content-type-options: nosniff' <<< "$headers" || { echo "FAIL $name: missing X-Content-Type-Options"; failures=$((failures + 1)); return; }
  grep -qi '^x-frame-options: DENY' <<< "$headers" || { echo "FAIL $name: missing X-Frame-Options"; failures=$((failures + 1)); return; }
  echo "PASS $name"
}

status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 10 "$BASE_URL/appointments")"
[[ "$status" == "401" ]] && echo 'PASS protected appointments reject anonymous access' || { echo "FAIL protected appointments returned $status"; failures=$((failures + 1)); }
status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 10 "$BASE_URL/audit/logs")"
[[ "$status" == "401" ]] && echo 'PASS protected audit logs reject anonymous access' || { echo "FAIL protected audit logs returned $status"; failures=$((failures + 1)); }
check 'health security headers' "$BASE_URL/health"

(( failures == 0 )) || exit 1
echo 'Security smoke test passed.'
