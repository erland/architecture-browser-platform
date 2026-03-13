# Browser automated tests

This step adds a focused safety net around the new local Browser architecture.

## Scope of the test net

The Browser refactor now depends on four local layers working together:

1. full snapshot payload retrieval and caching
2. local in-memory snapshot indexes
3. Browser session bootstrap and persisted view state
4. local Browser interactions (tree, top search, canvas, facts panel)

The tests added so far intentionally focus on those seams rather than broad snapshot-by-snapshot UI snapshots.

## Key test areas

### Cache and preparation

Covered by:

- `snapshotCache.test.ts`
- `browserSnapshotPreparation.test.ts`
- `browserSessionBootstrap.test.ts`

These tests protect:

- cache version/currentness logic
- local cache storage semantics
- promotion of cached full snapshot data into ready Browser-local data
- Browser bootstrap failure when a snapshot is not prepared
- preservation of Browser view state when reopening the same prepared snapshot

### Local indexes and selectors

Covered by:

- `browserSnapshotIndex.test.ts`

These tests protect:

- scope tree construction
- local search
- scope-scoped search
- dependency neighborhood lookup
- local facts retrieval

### Browser session store

Covered by:

- `browserSessionStore.test.ts`

These tests protect:

- opening a prepared snapshot into a Browser session
- scope selection and local search state
- canvas graph actions
- facts panel focus state
- persisted Browser view state hydration
- isolate/remove/pin/re-layout actions

### Browser-local interaction flow

Covered by:

- `browserTopSearch.test.ts`
- `browserNavigationTree.test.ts`
- `browserGraphWorkspaceModel.test.ts`
- `browserFactsPanel.test.ts`
- `browserOverviewStrip.test.ts`
- `browserArchitectureWorkflow.test.ts`

These tests protect:

- top-search activation mapping
- navigation-tree local expansion behavior
- canvas workspace model generation
- facts panel model generation
- compact overview signals
- local end-to-end workflow from search hit to canvas/facts update without backend explorer endpoints

### Browser mode metadata

Covered by:

- `browserTabs.test.ts`

This protects the route-local mode metadata used by the redesigned Browser shell.

## Why this test shape

The Browser now behaves more like a local modeling workspace than a server-projected explorer. That makes reducer/model/helper tests the highest-value safety net because they protect the cross-step architectural seams while keeping the tests fast and stable.

At this stage the most important regression risks are:

- stale snapshot cache promotion
- broken Browser bootstrap after reload/direct navigation
- lost view state when reopening the same snapshot
- search/tree/canvas/facts drift between local modules
- accidental reintroduction of server-explorer dependencies into `/browser`

The current test set is designed to catch those regressions early.

## Suggested future test additions

Later, if the Browser continues to stabilize, the next useful additions would be:

1. route-level rendering tests with a DOM-like environment
2. direct tests for BrowserView shell states (no workspace / no snapshot / not prepared / ready)
3. visual regression coverage for the canvas/facts/tree layout
4. contract tests that verify Browser only uses the full snapshot endpoint and not the old explorer endpoints
