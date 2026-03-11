# Platform Step 4 — Index-run orchestration and status tracking

## Scope delivered

Step 4 adds the first end-to-end run orchestration slice on top of the workspace/repository management baseline:

- run request API for a repository in a workspace
- persisted run history based on `index_run`
- explicit state transitions (`REQUESTED -> RUNNING -> COMPLETED/FAILED`)
- workspace-level recent run status query
- stub indexer adapter for invoking the later indexer/import boundary
- UI support for requesting successful or failing stub runs and inspecting recent status

## API endpoints

- `POST /api/workspaces/{workspaceId}/repositories/{repositoryId}/runs`
- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/runs`
- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/runs/{runId}`
- `GET /api/workspaces/{workspaceId}/runs/recent`

## Request model

`POST /runs` currently accepts a Step 4 stub-oriented request:

```json
{
  "triggerType": "MANUAL",
  "requestedSchemaVersion": "indexer-ir-v1",
  "requestedIndexerVersion": "step4-stub",
  "metadataJson": "{\"requestedBy\":\"web-ui\"}",
  "requestedResult": "SUCCESS"
}
```

`requestedResult` exists only to let the stub adapter simulate both success and failure paths before the real indexer integration exists.

## Persistence behavior

The `index_run` table from Step 2 is now actively used. The service persists transitions in separate transactions so the requested, running, and terminal states are actually written to the database rather than only the final status being visible after a single transaction commit.

## Audit behavior

Run transitions also create audit entries:

- `run.requested`
- `run.running`
- `run.completed`
- `run.failed`

This gives the platform an initial operational timeline even before richer job logs and diagnostics are implemented.

## UI behavior

The Step 4 web UI adds:

- workspace-level recent run status list
- per-repository latest run summary
- buttons to request a stub success or stub failure run
- a small form for default trigger/schema/indexer metadata used when requesting runs

## Intentional limitations

This is still an MVP stub orchestration layer:

- no background queue yet
- no asynchronous worker process yet
- no real call to the external indexer yet
- no snapshot creation yet
- no retry/cancel flows yet

Those are expected follow-on steps once the import pipeline becomes real.
