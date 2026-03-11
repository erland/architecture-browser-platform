#!/usr/bin/env bash
set -euo pipefail
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:8081}"
INDEXER_BASE_URL="${INDEXER_BASE_URL:-http://localhost:8082}"
SMOKE_REPO_PATH="${SMOKE_REPO_PATH:-/workspace/smoke-repo}"

wait_for() {
  local url="$1"
  local label="$2"
  for _ in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for $label at $url" >&2
  return 1
}

wait_for "$API_BASE_URL/api/health" "platform API"
wait_for "$WEB_BASE_URL" "platform web"
wait_for "$INDEXER_BASE_URL/health" "indexer worker"

API_BASE_URL="$API_BASE_URL" SMOKE_REPO_PATH="$SMOKE_REPO_PATH" python3 - <<'PY'
import json
import os
import urllib.request

api_base = os.environ['API_BASE_URL']
smoke_repo_path = os.environ['SMOKE_REPO_PATH']

def request(method, path, payload=None):
    data = None if payload is None else json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(api_base + path, data=data, method=method)
    req.add_header('Accept', 'application/json')
    if payload is not None:
        req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8')
        return json.loads(body) if body else None

workspace = request('POST', '/api/workspaces', {
    'workspaceKey': 'smoke-workspace',
    'name': 'Smoke Workspace',
    'description': 'Created by scripts/smoke-test.sh'
})
repository = request('POST', f"/api/workspaces/{workspace['id']}/repositories", {
    'repositoryKey': 'smoke-repo',
    'name': 'Smoke Repo',
    'sourceType': 'LOCAL_PATH',
    'localPath': smoke_repo_path,
    'remoteUrl': None,
    'defaultBranch': 'main',
    'metadataJson': '{"purpose":"smoke-test"}'
})
run = request('POST', f"/api/workspaces/{workspace['id']}/repositories/{repository['id']}/runs", {
    'triggerType': 'MANUAL',
    'requestedSchemaVersion': '1.0.0',
    'requestedIndexerVersion': 'http-worker',
    'metadataJson': '{"requestedBy":"smoke-test"}',
    'requestedResult': 'SUCCESS'
})
if run['status'] == 'FAILED':
    raise SystemExit(f"Indexer smoke run failed: {run.get('errorSummary')}")
if run.get('outcome') not in ('SUCCESS', 'PARTIAL'):
    raise SystemExit(f"Unexpected run outcome: {run.get('outcome')}")
snapshots = request('GET', f"/api/workspaces/{workspace['id']}/snapshots")
if not snapshots:
    raise SystemExit('Smoke run completed but no snapshots were imported.')
print('Smoke test created workspace', workspace['id'])
print('Smoke test created repository', repository['id'])
print('Smoke test completed run', run['id'], 'with outcome', run.get('outcome'))
print('Smoke test imported', len(snapshots), 'snapshot(s)')
PY

echo "Smoke test passed against $API_BASE_URL, $WEB_BASE_URL, and $INDEXER_BASE_URL"
