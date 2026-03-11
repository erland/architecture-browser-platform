#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
ENV_FILE="deploy/env/platform-test.env"
if [[ -f "$ENV_FILE" ]]; then
  docker compose --env-file "$ENV_FILE" -f deploy/docker-compose/docker-compose.test.yml down
else
  docker compose -f deploy/docker-compose/docker-compose.test.yml down
fi
