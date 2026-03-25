# Snapshot catalog service composition

- `SnapshotCatalogService` is the thin application-service entry point.
- `SnapshotCatalogQueryService` owns repository/database lookup.
- `SnapshotCatalogPayloadLoader` loads and parses snapshot payload documents.
- `SnapshotCatalogResponseAssembler` converts projections and payload context into API DTOs.
- `SnapshotCatalogSummaryProjection` captures summary-only data needed by the assembler.

Keep query, payload loading, and response assembly separate so snapshot catalog behavior stays easy to evolve and test.
