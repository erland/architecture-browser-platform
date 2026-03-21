# Step 6: Refactor `SnapshotCatalogService.java`

## Goal
Thin out `SnapshotCatalogService` by separating:
- stored snapshot document reading
- full-payload mapping
- metadata sanitation
- overview aggregation and warning generation

## Changes made

### `SnapshotCatalogService.java`
Kept as the public application service and reduced to orchestration for:
- snapshot lookup and workspace validation
- summary mapping
- coordination of document reading/mapping/overview helpers

### New helpers
- `SnapshotCatalogDocumentReader.java`
  - parses stored raw snapshot payload JSON into `ArchitectureIndexDocument`

- `SnapshotCatalogDocumentMapper.java`
  - maps source/run/completeness/full payload sections
  - maps scopes/entities/relationships/viewpoints/diagnostics/source refs
  - delegates metadata sanitation

- `SnapshotCatalogMetadataSanitizer.java`
  - sanitizes nested metadata maps/lists
  - preserves null metadata values and removes null keys

- `SnapshotCatalogOverviewBuilder.java`
  - builds kind summaries
  - builds top-scope summary
  - builds recent-diagnostics summary
  - collects user-facing warnings

## Result
The former mixed service no longer combines:
- JSON payload parsing
- full payload section mapping
- metadata sanitation
- overview aggregation
- warning generation

## Verification status
In this packaging environment:
- `mvn` was not available, so full Quarkus test execution could not be run here
- the primary regression target remains:
  - `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotCatalogResourceTest.java`

## Recommended local verification
```bash
cd apps/api
mvn test
```
