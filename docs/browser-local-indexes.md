# Browser local indexes (Step 4)

This step adds the first client-side browser domain/index layer on top of the cached full snapshot payload.

## Goal

Turn a cached `FullSnapshotPayload` into efficient in-memory lookup structures so the Browser can later support:

- tree navigation
- local search
- dependency expansion
- facts/details lookup

without repeated browser-specific backend calls.

## Added modules

### `apps/web/src/browserSnapshotIndex.ts`

Core responsibilities:

- build a `BrowserSnapshotIndex` from a `FullSnapshotPayload`
- keep entity/scope/relationship/diagnostic lookups in maps
- maintain scope hierarchy and scope paths
- maintain inbound/outbound relationship lookup by entity
- expose selector functions for local Browser behavior
- memoize built indexes per snapshot id in memory for the current browser session

Main exported operations:

- `buildBrowserSnapshotIndex(payload)`
- `getOrBuildBrowserSnapshotIndex(payload)`
- `clearBrowserSnapshotIndex(snapshotId?)`
- `getScopeTreeRoots(index)`
- `getScopeChildren(index, parentScopeId)`
- `searchBrowserSnapshotIndex(index, query, options)`
- `getDependencyNeighborhood(index, entityId, direction)`
- `getScopeFacts(index, scopeId)`
- `getEntityFacts(index, entityId)`

### `apps/web/src/hooks/useLocalSnapshotIndex.ts`

A small hook that:

1. reads the selected snapshot from the browser snapshot cache
2. builds or reuses the in-memory browser index
3. exposes loading/ready/missing/error state for future Browser-store wiring

This hook is additive in Step 4 and is not yet the main Browser data source.

## Current selector coverage

The local index layer now supports these later migration targets:

- **tree navigation** via scope hierarchy and scope paths
- **search** across scopes, entities, relationships, and diagnostics
- **dependency expansion** via inbound/outbound relationship lookup
- **facts** for scopes and entities, including diagnostics and source refs

## Intentional non-goals in this step

This step does **not** yet:

- replace `useBrowserExplorer`
- rewrite Browser tabs to use local selectors
- introduce canvas/session state
- remove old backend browser endpoints

Those remain for later steps after the local data layer is proven.

## Verification

Focused frontend tests cover:

- scope-tree construction
- local search behavior
- scope-scoped search filtering
- local dependency neighborhood lookup
- local facts lookup
- in-memory memoization by snapshot id
