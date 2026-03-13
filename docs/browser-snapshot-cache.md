# Browser snapshot cache (Step 3)

Step 3 introduces a browser-managed snapshot cache backed by IndexedDB with a fallback to an in-memory store when IndexedDB is unavailable.

## New frontend modules

- `apps/web/src/snapshotCache.ts`
  - storage abstraction for cached full snapshot payloads
  - IndexedDB-backed implementation for browser runtime
  - in-memory implementation for tests and non-browser environments
- `apps/web/src/hooks/useSnapshotCachePreload.ts`
  - preloads the currently selected snapshot into the local cache from the Snapshots flow

## Cache model

Cached snapshot records are keyed by `snapshotId` and store:

- `snapshotId`
- `workspaceId`
- `repositoryId`
- `snapshotKey`
- `cacheVersion`
- `cachedAt`
- `lastAccessedAt`
- full `payload`

## Version / invalidation rule

The current cache version is derived from snapshot summary metadata:

- `importedAt`
- `sourceRevision`
- `schemaVersion`
- `indexerVersion`

If any of those change, the cached record is considered stale and Step 3 will re-download the full snapshot payload before overwriting the cache entry.

## Current integration

The Snapshots view now preloads the selected snapshot into the local cache using the new full snapshot endpoint from Step 2.

This keeps Step 3 focused on storage and cache lifecycle without yet switching Browser itself to local indexes or a new session store. Those migrations are intentionally deferred to later steps.

## Current API dependency

Step 3 uses:

- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/full`

## Test coverage

`apps/web/src/__tests__/snapshotCache.test.ts` verifies:

- cache put/get behavior
- cache version freshness checks
- obsolete snapshot eviction
