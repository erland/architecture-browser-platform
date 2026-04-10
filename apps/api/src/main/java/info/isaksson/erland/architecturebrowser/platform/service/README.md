# service

Backend application services are organized around explicit workflow steps.

## snapshot import

The snapshot import flow is split into focused internal steps:

- `SnapshotImportPathResolver` validates and resolves workspace / repository / run path ownership.
- `SnapshotImportDocumentPreparationService` parses the payload, validates the contract, and reads optional source-file sidecars.
- `SnapshotImportWorkflowService` persists the snapshot, persists imported facts, records audit events, and assembles the API response.
- `SnapshotImportRunLifecycleHandler` wraps run-linked imports with lifecycle transitions.

`SnapshotImportService` now remains a thin application-service coordinator over those workflow steps.

## management and runs

To keep the backend service layer from becoming a default dumping ground, stable mapping and query helpers are now placed in narrower package-owned classes:

- `management/WorkspaceResponseMapper`
- `management/RepositoryResponseMapper`
- `management/WorkspaceRepositoryCountQuery`
- `management/ManagementStringSupport`
- `runs/RunQueryService`
- `runs/RunLookupService`
- `runs/RunResponseMapper`

The top-level application services continue to coordinate workflows, while package-owned helpers carry stable mapping and lookup concerns.
