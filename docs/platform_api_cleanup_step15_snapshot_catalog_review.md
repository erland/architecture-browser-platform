# Platform API cleanup Step 15 — smaller snapshot catalog endpoint review

## Scope

This step reviews the smaller snapshot catalog endpoints that remain in `SnapshotCatalogResource` after the Browser-first cleanup waves.

The goal is to distinguish:
- endpoints still used by the cleaned frontend and therefore protected
- endpoints not used by the cleaned frontend but still potentially useful as backend convenience APIs
- endpoints that could be removed in a later explicit reduction wave

## Current snapshot catalog resource surface

`SnapshotCatalogResource` currently exposes:

- `GET /api/workspaces/{workspaceId}/snapshots`
- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/snapshots`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/full`

## Frontend usage status

### Protected by the cleaned Browser-first frontend

These endpoints are still part of the active frontend flow and should be kept:

- `GET /api/workspaces/{workspaceId}/snapshots`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/full`

These support:
- snapshot selection from the Browser-first UI
- loading the full snapshot payload used by the browser-local index and analysis workflow

### Not used by the cleaned frontend

These endpoints are not called by the cleaned frontend:

- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/snapshots`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview`

## Product decision assessment

### Repository snapshot listing

`GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/snapshots`

Assessment:
- not used by the cleaned frontend
- still a reasonable backend convenience endpoint
- low maintenance burden compared with the already-removed explorer APIs

Recommendation:
- keep for now unless you want to aggressively minimize the backend surface
- treat as optional removal in a future explicit API reduction wave

### Snapshot detail endpoint

`GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}`

Assessment:
- not used by the cleaned frontend
- narrower and cheaper than the full payload endpoint
- may still be useful for scripts, tests, or future admin/support views

Recommendation:
- keep for now
- optional removal later if your goal becomes a minimal backend surface strictly tailored to the Browser-first frontend

### Snapshot overview endpoint

`GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview`

Assessment:
- not used by the cleaned frontend
- overlaps conceptually with full payload and detail responses
- strongest candidate of the three for future removal if minimizing endpoint count becomes a priority

Recommendation:
- safe to defer
- if you choose a later reduction wave, remove this endpoint first among the smaller snapshot catalog endpoints

## Conclusion

No code deletion is performed in Step 15.

The conclusion of this review is:

- keep the active frontend endpoints unchanged:
  - workspace snapshot listing
  - full snapshot payload
- keep the smaller unused snapshot catalog endpoints for now
- if a later explicit backend minimization wave is desired, prioritize removal in this order:
  1. snapshot overview endpoint
  2. snapshot detail endpoint
  3. repository snapshot listing endpoint

This keeps the current backend stable while documenting the next-smallest optional reduction candidates.
