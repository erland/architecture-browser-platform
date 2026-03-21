# Step 5 — Refactor `SnapshotSearchService.java`

## Goal

Reduce the responsibility load in `SnapshotSearchService.java` without changing API behavior.

## What changed

The former service-level responsibilities were split into focused package-private collaborators:

- `SnapshotSearchIndex.java`
  - shared record types for scopes, entities, source refs, relationships, and the transient search index
- `SnapshotSearchIndexBuilder.java`
  - builds the transient search index from imported facts
  - parses payload JSON and extracts source refs
- `SnapshotSearchQuerySupport.java`
  - scope selection
  - scope traversal
  - scope path resolution
  - display-label and normalization helpers
- `SnapshotSearchMatcher.java`
  - entity match/scoring logic
  - match-reason collection
  - kind-summary aggregation
- `SnapshotSearchResponseMapper.java`
  - maps transient search/index objects into `SearchDtos`
  - formats JSON metadata text

`SnapshotSearchService.java` is now the orchestration layer that:

1. loads the snapshot summary
2. builds the transient index
3. delegates query selection / search / ranking / mapping
4. returns the existing DTO responses

## Result

The main service is substantially thinner and the previously mixed concerns are now separated into:

- index construction
- query normalization and scope traversal
- matching / scoring
- response assembly

## Verification performed in packaging environment

The container used for packaging did not have Maven installed, so a full Quarkus/JUnit build could not be executed here.

Recommended local verification:

```bash
cd apps/api
mvn test
```

Most relevant regression target:

- `apps/api/src/test/java/.../SnapshotSearchResourceTest.java`
