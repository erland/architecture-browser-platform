# Browser local-only architecture (Step 14)

## Goal

Step 14 removes the Browser route's dependence on server-computed Browser explorer endpoints. The Browser route now treats the prepared full snapshot payload and local in-memory indexes as the only analysis source.

## What changed

The `/browser` route no longer uses the old Browser explorer hook or the legacy Browser tab components.

Removed from the Browser route:
- server-computed layout tree calls
- server-computed layout scope detail calls
- server-computed dependency view calls
- server-computed entry-point view calls
- server-computed search calls
- server-computed entity detail calls
- the migration detail tray that embedded the old explorer tabs

The Browser route now uses only:
- selected workspace/repository/snapshot metadata from existing workspace data loading
- prepared local snapshot cache/bootstrap
- local snapshot index selectors
- Browser session store
- tree + top search + canvas + facts panel workflow

## Current Browser data flow

1. User selects and prepares a snapshot from the Snapshots view.
2. Full snapshot payload is stored in IndexedDB and indexed locally.
3. Browser route bootstraps a session from the prepared local cache.
4. Tree, search, canvas, and facts all read from the local session/index.
5. Browser mode switching only changes local analysis emphasis. It does not trigger backend Browser projection calls.

## Backend impact

This step removes Browser-route dependence on the following backend resources:
- `SnapshotLayoutResource`
- `SnapshotDependencyResource`
- `SnapshotEntryPointResource`
- `SnapshotSearchResource`

These resources still remain in the backend for now so the older snapshot-centric flows and migration-era tooling are not broken prematurely. A later cleanup can remove them completely once no remaining view depends on them.

## Frontend impact

The Browser route no longer imports:
- `useBrowserExplorer`
- `OverviewTab`
- `LayoutTab`
- `DependenciesTab`
- `EntryPointsTab`
- `SearchTab`

Those pieces are now outside the Browser execution path.

## Result

Browser is now a true local analysis workspace:
- backend still provides snapshot lifecycle and full payload retrieval
- browser owns exploration behavior
- Browser no longer depends on server-computed Browser projections
