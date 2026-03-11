#!/usr/bin/env bash
set -euo pipefail
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:8081}"

curl -fsS "$API_BASE_URL/api/health" >/dev/null
curl -fsS "$WEB_BASE_URL" >/dev/null
curl -fsS "$API_BASE_URL/api/workspaces" >/dev/null

echo "Smoke test passed against $API_BASE_URL and $WEB_BASE_URL"
