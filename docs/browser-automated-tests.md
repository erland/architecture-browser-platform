# Browser automated tests

The Browser now has a focused safety net for both its:

1. local-first runtime architecture
2. entity-first analysis model

## Scope of the test net

The Browser depends on these local layers working together:

1. full snapshot payload retrieval and caching
2. local in-memory snapshot indexes
3. Browser session bootstrap and persisted view state
4. local Browser interactions (tree, top search, canvas, facts panel)
5. entity-first resolution policies and regression coverage

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
- direct/subtree/primary entity resolution
- tree-mode filtering and visibility helpers

### Browser session store

Covered by:

- `browserSessionStore.test.ts`

These tests protect:

- opening a prepared snapshot into a Browser session
- scope selection and local search state
- canvas graph actions
- facts panel focus state
- persisted Browser view state hydration
- entity-first scope add defaults
- default tree-mode heuristics
- isolate/remove/pin/re-layout actions

### Browser-local interaction flow

Covered by:

- `browserTopSearch.test.ts`
- `browserNavigationTree.test.ts`
- `browserGraphWorkspaceModel.test.ts`
- `browserGraphWorkspace.test.ts`
- `browserFactsPanel.test.ts`
- `browserOverviewStrip.test.ts`
- `browserArchitectureWorkflow.test.ts`

These tests protect:

- top-search activation mapping
- split scope navigation vs scope add behavior in search
- navigation-tree local expansion behavior
- entity-first tree add behavior
- canvas workspace model generation
- facts panel bridge behavior
- compact overview signals
- local end-to-end workflow from search hit to canvas/facts update without backend explorer endpoints

### Dedicated entity-first regression suite

Covered by:

- `browserEntityFirstRegression.test.ts`

This protects the new Browser model at the seams that are easiest to regress:

- file/directory/package add-to-canvas defaults
- facts-panel scope-to-entity bridge behavior
- entity-first toolbar actions
- search split between navigation and analysis seeding
- filesystem/package/advanced tree modes

## Why this test shape

The Browser now behaves more like a local modeling workspace than a server-projected explorer. That makes reducer/model/helper tests the highest-value safety net because they protect the cross-step architectural seams while keeping the tests fast and stable.

At this stage the most important regression risks are:

- stale snapshot cache promotion
- broken Browser bootstrap after reload/direct navigation
- lost view state when reopening the same snapshot
- drift between scope navigation and entity analysis semantics
- accidental reintroduction of scope-first canvas defaults
- accidental reintroduction of server-explorer dependencies into `/browser`
