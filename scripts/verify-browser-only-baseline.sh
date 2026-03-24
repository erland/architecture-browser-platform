#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/docs/reports"
SUMMARY="$REPORT_DIR/browser-only-step1-baseline-check.txt"
mkdir -p "$REPORT_DIR"
: > "$SUMMARY"

log() {
  echo "$1" | tee -a "$SUMMARY"
}

check_exists() {
  local path="$1"
  if [ -e "$ROOT_DIR/$path" ]; then
    log "[present] $path"
  else
    log "[missing] $path"
    return 1
  fi
}

has_web_dependencies() {
  [ -f "$ROOT_DIR/node_modules/react/package.json" ] && [ -f "$ROOT_DIR/node_modules/typescript/package.json" ]
}

has_web_test_dependencies() {
  [ -f "$ROOT_DIR/node_modules/jest/bin/jest.js" ] && [ -f "$ROOT_DIR/node_modules/react/package.json" ]
}

log "Browser-only cleanup step 1 baseline check"
log "Repository: $ROOT_DIR"
log "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
log ""
log "Frozen baseline inventory checks"

check_exists "apps/web/src/App.tsx"
check_exists "apps/web/src/views/BrowserView.tsx"
check_exists "apps/web/src/components/BrowserSourceTreeSwitcherDialog.tsx"
check_exists "apps/web/src/components/AppNavigation.tsx"
check_exists "apps/web/src/views/ManageSourcesView.tsx"
check_exists "apps/web/src/views/WorkspacesView.tsx"
check_exists "apps/web/src/views/CompareView.tsx"
check_exists "apps/web/src/views/OperationsView.tsx"
check_exists "docs/platform_browser_only_frontend_cleanup_step1.md"

log ""
log "Route inventory from apps/web/src/routing/appRoutes.ts"
if grep -q "'/browser'" "$ROOT_DIR/apps/web/src/routing/appRoutes.ts"; then
  log "[route] /browser present"
else
  log "[route] /browser missing"
  exit 1
fi
for route in /sources /workspaces /compare /operations; do
  if grep -q "'$route'" "$ROOT_DIR/apps/web/src/routing/appRoutes.ts"; then
    log "[route] $route present in frozen baseline"
  else
    log "[route] $route missing from frozen baseline"
    exit 1
  fi
done

log ""
if has_web_dependencies; then
  log "[web:typecheck] running npm run typecheck:web"
  if (
    cd "$ROOT_DIR"
    npm run typecheck:web
  ) >> "$SUMMARY" 2>&1; then
    log "[web:typecheck] PASS"
  else
    log "[web:typecheck] FAIL - see details above in this report"
  fi
else
  log "[web:typecheck] SKIPPED - install repository npm dependencies first"
fi

if has_web_test_dependencies; then
  log "[web:targeted-tests] running browser-first baseline tests"
  if (
    cd "$ROOT_DIR/apps/web"
    npm test -- --runTestsByPath \
      src/__tests__/appRoutes.test.ts \
      src/__tests__/browserSourceTreeLauncher.test.tsx \
      src/__tests__/browserSourceTreeSwitcherDialog.test.tsx \
      src/__tests__/manageSourcesView.test.tsx
  ) >> "$SUMMARY" 2>&1; then
    log "[web:targeted-tests] PASS"
  else
    log "[web:targeted-tests] FAIL - see details above in this report"
  fi
else
  log "[web:targeted-tests] SKIPPED - install repository npm dependencies first"
fi

log ""
log "Reference document: docs/platform_browser_only_frontend_cleanup_step1.md"
