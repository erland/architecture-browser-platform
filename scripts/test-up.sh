#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
ENV_FILE="deploy/env/platform-test.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy deploy/env/platform-test.env.example first." >&2
  exit 1
fi
docker compose --env-file "$ENV_FILE" -f deploy/docker-compose/docker-compose.test.yml up -d
