# Platform Step 5 — Snapshot import pipeline

## What this step adds

Step 5 turns the earlier contract-validation and run-tracking work into a real snapshot import boundary.

Implemented pieces:
- repository-scoped snapshot import endpoint
- run-linked snapshot import endpoint
- immutable snapshot creation
- imported fact persistence for scopes, entities, relationships, and diagnostics
- semantic validation beyond JSON Schema validation
- run status transition to `IMPORTING` and final outcome mapping for success/partial/failure
- audit records for snapshot imports

## API endpoints

### Import into a repository
`POST /api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir`

Use this when an index result should be imported without linking to an existing run record.

### Import into a run
`POST /api/workspaces/{workspaceId}/repositories/{repositoryId}/runs/{runId}/imports/indexer-ir`

Use this when an index result belongs to an existing run record. The run is moved to `IMPORTING`, then completed as:
- `SUCCESS` when the payload outcome/completeness is complete
- `PARTIAL` when the payload outcome/completeness is partial
- `FAILED` when validation fails or the payload explicitly reports failure

## Partial payload behavior

Defined rule for MVP:
- schema-valid and semantically valid partial payloads are accepted
- the snapshot is created with `status=READY` and `completenessStatus=PARTIAL`
- diagnostics are persisted as imported facts
- the derived run outcome becomes `PARTIAL`
- warnings are returned in the import response

## Safe rejection rules

A payload is rejected with HTTP 400 when:
- JSON Schema validation fails
- semantic validation fails, such as missing referenced scopes/entities or duplicate ids

Rejected payloads do not create snapshots.

## Notes

This step still stores imported browse facts in the generic `imported_fact` table. That keeps the import boundary stable while later browse-specific query shapes are added in Steps 6–10.
