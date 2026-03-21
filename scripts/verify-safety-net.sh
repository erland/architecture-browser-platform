#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$REPO_ROOT/docs/reports"
mkdir -p "$REPORT_DIR"

WEB_LOG="$REPORT_DIR/web-test-baseline.log"
API_LOG="$REPORT_DIR/api-test-baseline.log"
SUMMARY="$REPORT_DIR/safety-net-summary.txt"

: > "$SUMMARY"

echo "Safety net verification" | tee -a "$SUMMARY"
echo "Repository: $REPO_ROOT" | tee -a "$SUMMARY"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$SUMMARY"
echo >> "$SUMMARY"

run_web_tests() {
  echo "[web] Checking node_modules" | tee -a "$SUMMARY"
  if [[ ! -f "$REPO_ROOT/node_modules/jest/bin/jest.js" ]]; then
    echo "[web] SKIPPED: root node_modules missing. Run 'npm install' from repository root first." | tee -a "$SUMMARY"
    return 2
  fi

  echo "[web] Running npm run test:web" | tee -a "$SUMMARY"
  if npm run test:web > "$WEB_LOG" 2>&1; then
    echo "[web] PASS" | tee -a "$SUMMARY"
    return 0
  else
    echo "[web] FAIL (see $WEB_LOG)" | tee -a "$SUMMARY"
    return 1
  fi
}

run_api_tests() {
  echo "[api] Checking Maven" | tee -a "$SUMMARY"
  if ! command -v mvn >/dev/null 2>&1; then
    echo "[api] SKIPPED: mvn not installed or not on PATH." | tee -a "$SUMMARY"
    return 2
  fi

  echo "[api] Running mvn test" | tee -a "$SUMMARY"
  if (cd "$REPO_ROOT/apps/api" && mvn test > "$API_LOG" 2>&1); then
    echo "[api] PASS" | tee -a "$SUMMARY"
    return 0
  else
    echo "[api] FAIL (see $API_LOG)" | tee -a "$SUMMARY"
    return 1
  fi
}

cd "$REPO_ROOT"
web_status=0
api_status=0
run_web_tests || web_status=$?
run_api_tests || api_status=$?

echo >> "$SUMMARY"
echo "Result codes: web=$web_status api=$api_status" | tee -a "$SUMMARY"

if [[ "$web_status" -eq 1 || "$api_status" -eq 1 ]]; then
  exit 1
fi
