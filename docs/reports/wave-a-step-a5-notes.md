# Wave A — Step A5 cleanup pass

This cleanup pass makes the Wave A refactors more consistent without changing the public behavior introduced in A2–A4.

## What was cleaned up

### Web: workspace data hook boundary
- Added `apps/web/src/hooks/workspaceData/index.ts` as a barrel for the extracted Workspace Data submodule.
- Simplified `apps/web/src/hooks/useWorkspaceData.ts` so it imports from the submodule barrel instead of reaching into each file directly.
- Kept `useWorkspaceData.ts` as the stable facade expected by the existing views.

### API: operations retention naming/normalization
- Reduced duplicated keep-count normalization logic in `OperationsAdminService.java`.
- Added small private coordinator helpers for:
  - keep-snapshot normalization
  - keep-run normalization
  - retention audit recording
- This keeps the service closer to a coordinator role and aligns the naming introduced in A3.

### API: dependency explorer collaborator ownership
- Promoted the A4 helper classes to DI-managed collaborators:
  - `SnapshotDependencyIndexBuilder`
  - `SnapshotDependencyQuerySupport`
  - `SnapshotDependencyResponseMapper`
- Updated `SnapshotDependencyExplorerService.java` to inject and use those collaborators directly instead of constructing them inline.
- This aligns the dependency explorer with the same service/collaborator shape used elsewhere in the platform API.

## Intended outcome
- clearer module import boundary in the web hook cluster
- less normalization/audit duplication in the operations coordinator
- stronger, more explicit ownership boundaries in the dependency explorer service

## Verification note
Normal project verification could not be run in this container:
- Maven is not installed here
- the packaged repo does not include the full dependency setup required for end-to-end frontend verification

So this step was kept intentionally conservative and structure-preserving.
