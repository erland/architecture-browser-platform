#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/docs/reports"
SUMMARY="$REPORT_DIR/remaining-frontend-step1-baseline-check.txt"
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

log "Remaining frontend cleanup step 1 baseline check"
log "Repository: $ROOT_DIR"
log "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
log ""
log "Browser-only entry path checks"
check_exists "apps/web/src/main.tsx"
check_exists "apps/web/src/App.tsx"
check_exists "apps/web/src/views/BrowserView.tsx"

log ""
log "Active Browser UI checks"
check_exists "apps/web/src/components/BrowserSourceTreeSwitcherDialog.tsx"
check_exists "apps/web/src/components/BrowserTopSearch.tsx"
check_exists "apps/web/src/components/BrowserNavigationTree.tsx"
check_exists "apps/web/src/components/BrowserGraphWorkspace.tsx"
check_exists "apps/web/src/components/BrowserFactsPanel.tsx"
check_exists "apps/web/src/components/BrowserViewpointDialog.tsx"

log ""
log "Browser persistence foundation checks"
check_exists "apps/web/src/savedCanvasModel.ts"
check_exists "apps/web/src/savedCanvasLocalStore.ts"
check_exists "apps/web/src/appModel.customization.ts"
check_exists "docs/remaining_frontend_cleanup_step1_baseline.md"

log ""
log "App shell checks"
if grep -q "return <BrowserView />;" "$ROOT_DIR/apps/web/src/App.tsx"; then
  log "[app] App.tsx renders BrowserView directly"
else
  log "[app] App.tsx no longer matches expected Browser-only shell"
  exit 1
fi

if grep -q "normalizeLegacyBrowserPath" "$ROOT_DIR/apps/web/src/App.tsx"; then
  log "[app] legacy Browser path normalization still present"
else
  log "[app] legacy Browser path normalization missing"
  exit 1
fi

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

log ""
log "Reference document: docs/remaining_frontend_cleanup_step1_baseline.md"
