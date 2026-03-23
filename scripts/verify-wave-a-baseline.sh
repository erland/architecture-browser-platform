#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/docs/reports"
SUMMARY="$REPORT_DIR/wave-a-baseline-check.txt"
mkdir -p "$REPORT_DIR"
: > "$SUMMARY"

log() {
  echo "$1" | tee -a "$SUMMARY"
}

log "Wave A baseline check"
log "Repository: $ROOT_DIR"
log "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
log ""

log "Target files:"
log "- apps/web/src/hooks/useWorkspaceData.ts"
log "- apps/api/src/main/java/**/OperationsAdminService.java"
log "- apps/api/src/main/java/**/SnapshotDependencyExplorerService.java"
log ""

if [ -d "$ROOT_DIR/apps/web/node_modules" ] || [ -d "$ROOT_DIR/node_modules" ]; then
  log "[web:typecheck] running npx tsc -p tsconfig.json --noEmit"
  (
    cd "$ROOT_DIR/apps/web"
    npx tsc -p tsconfig.json --noEmit
  ) >> "$SUMMARY" 2>&1
  log "[web:typecheck] PASS"
else
  log "[web:typecheck] SKIPPED - install npm dependencies first"
fi

if [ -f "$ROOT_DIR/node_modules/jest/bin/jest.js" ]; then
  log "[web:targeted-tests] running"
  (
    cd "$ROOT_DIR/apps/web"
    npm test -- --runTestsByPath \
      src/__tests__/appRouteState.test.ts \
      src/__tests__/appRoutes.test.ts \
      src/__tests__/appSelectionState.test.ts \
      src/__tests__/platformApi.test.ts \
      src/__tests__/operationsViewModel.test.ts \
      src/__tests__/dependencyViewModel.test.ts
  ) >> "$SUMMARY" 2>&1
  log "[web:targeted-tests] PASS"
else
  log "[web:targeted-tests] SKIPPED - root Jest installation missing; run npm install from repository root"
fi

if command -v mvn >/dev/null 2>&1; then
  log "[api:test] running mvn test"
  (
    cd "$ROOT_DIR/apps/api"
    mvn test
  ) >> "$SUMMARY" 2>&1
  log "[api:test] PASS"
else
  log "[api:test] SKIPPED - Maven not installed in current environment"
fi

log ""
log "Relevant backend guards:"
log "- src/test/java/info/isaksson/erland/architecturebrowser/platform/api/OperationsAdminResourceTest.java"
log "- src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotDependencyResourceTest.java"
log ""
log "Detailed baseline note: docs/reports/wave-a-baseline-status.md"
