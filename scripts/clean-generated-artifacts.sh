#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TARGETS=(
  "apps/web/dist"
  "apps/web/node_modules"
  "apps/web/tsconfig.app.tsbuildinfo"
  "apps/api/target"
)

removed_any=0
for target in "${TARGETS[@]}"; do
  if [ -e "$target" ]; then
    rm -rf "$target"
    echo "Removed $target"
    removed_any=1
  else
    echo "Already clean: $target"
  fi
done

if [ "$removed_any" -eq 0 ]; then
  echo "No generated artifacts needed removal."
else
  echo "Generated artifacts cleaned."
fi
