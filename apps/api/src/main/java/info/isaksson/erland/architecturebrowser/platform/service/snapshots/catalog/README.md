# snapshot catalog

Contains snapshot catalog canonical mapping, payload loading, summary/query support, and Browser-facing response assembly.


## Payload mapping split

Full snapshot payload mapping is now split across focused helpers: `SnapshotCatalogStructurePayloadMapper`, `SnapshotCatalogDependencyViewsPayloadMapper`, `SnapshotCatalogInsightsPayloadMapper`, and `SnapshotCatalogSourceRefMapper`. `SnapshotCatalogDocumentMapper` now coordinates those narrower mappers instead of owning all payload-shaping logic directly.
