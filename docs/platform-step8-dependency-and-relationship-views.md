# Platform Step 8 – Dependency and Relationship Views

## What was added

### API
- Added `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/dependencies`
- Supports optional query parameters:
  - `scopeId`: focus the dependency view on a scope subtree
  - `direction`: `ALL`, `INBOUND`, or `OUTBOUND`
  - `focusEntityId`: narrow the visible dependency set to one selected entity
- Response includes:
  - scope context
  - relationship kind summary
  - visible entity list with inbound/outbound counts
  - relationship list with boundary/internal classification
  - focused entity inbound/outbound drill-down when selected

### Backend behavior
- Uses imported facts already stored in the platform database
- Reuses the repository/module/package scope hierarchy from the imported snapshot
- Treats relationships as:
  - `INTERNAL` when both ends are inside the selected scope subtree
  - `INBOUND` when the source is outside and the target is inside
  - `OUTBOUND` when the source is inside and the target is outside
- Includes external neighbor entities when they participate in visible relationships

### Frontend
- Added a new Step 8 dependency section on the snapshot page
- Added controls for:
  - scope focus
  - direction filter
  - entity focus
- Added views for:
  - summary counters
  - focused entity stats
  - visible entities
  - relationship graph/list style inspection

## Tests

### Backend
- Added `SnapshotDependencyResourceTest`
- Covers:
  - scope filtering
  - inbound/internal classification
  - focused entity drill-down
  - direction filtering

### Frontend
- Added low-fragility Jest tests for pure dependency view-model helpers in:
  - `apps/web/src/__tests__/dependencyViewModel.test.ts`
- These avoid DOM-heavy rendering assertions so they should be less likely to break during UI refactors.

## Local verification status in this environment
- TypeScript static check was run successfully against the patched frontend source using a lightweight shim-based syntax pass.
- Full Maven test execution could not be run here because Maven is not installed in this container.
