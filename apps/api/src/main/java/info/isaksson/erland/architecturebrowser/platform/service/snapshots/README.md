# snapshots

This package is organized by backend responsibility:

- `catalog/` contains snapshot catalog loading, canonical mapping, query support, and Browser-facing assembly.
- `savedcanvas/` contains saved-canvas service orchestration plus response/document serialization helpers.

Java package names remain unchanged (`...service.snapshots`) so this directory split is navigation-only and behavior-preserving.


Step 10 split snapshot catalog reads further into explicit workflow steps:

- `SnapshotCatalogRequestContextLoader` resolves the snapshot + summary request context.
- `SnapshotCatalogReadWorkflowService` performs payload loading plus Browser-facing response assembly for detail/overview/full-payload reads.
