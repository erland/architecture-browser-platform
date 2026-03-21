#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p docs/reports
REPORT="docs/reports/refactor-verification.txt"
: > "$REPORT"

log() {
  echo "$1" | tee -a "$REPORT"
}

log "Refactor verification"
log "====================="
log ""

if [ -d apps/web/node_modules ] || [ -d node_modules ]; then
  log "[web:typecheck] running"
  (
    cd apps/web
    npx tsc -p tsconfig.json --noEmit
  ) >> "$ROOT_DIR/$REPORT" 2>&1
  log "[web:typecheck] PASS"
else
  log "[web:typecheck] SKIPPED - install npm dependencies first"
fi

if command -v mvn >/dev/null 2>&1; then
  log "[api:test] available - run 'cd apps/api && mvn test' for full backend regression coverage"
else
  log "[api:test] SKIPPED - Maven not installed in current environment"
fi

log ""
log "Done."
