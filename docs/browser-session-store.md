# Browser session/store (Step 6)

Step 6 introduces a dedicated Browser session layer so Browser becomes a true local workspace instead of a set of disconnected component-local states.

## New modules

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `apps/web/src/hooks/useBrowserSessionBootstrap.ts`

## What the session now owns

The Browser session state centralizes the interaction model described in the refactor plan:

- active prepared snapshot
- loaded full snapshot payload
- built local Browser indexes
- selected scope
- selected entities
- search query and search results
- canvas nodes and edges currently shown
- focused element
- facts panel mode and placement
- graph expansion history
- fit-view requests

## Session lifecycle

### 1. Prepare snapshot in Snapshots view

The existing Step 5 flow still prepares Browser data by:

- downloading the full snapshot payload
- storing it in IndexedDB
- priming local Browser indexes

### 2. Open Browser session

When the user opens Browser from Snapshots, the app now opens a Browser session immediately from the prepared local snapshot.

### 3. Bootstrap Browser route

The Browser route also performs a defensive bootstrap:

- it reads the selected snapshot from shared selection context
- it loads the prepared payload from the Browser cache
- it opens the Browser session if needed

This keeps Browser resilient across reloads and direct route navigation.

## Design intent

This step is still additive.

The old `useBrowserExplorer` tab flow remains in place, but Browser now has a dedicated workspace store that later steps can switch over to for:

- navigation tree selection
- local search orchestration
- canvas graph interactions
- facts panel behavior

## Persistence

A compact view-state subset is persisted in local storage so Browser can preserve user context without persisting the full payload twice.

Persisted state includes:

- active snapshot identity
- selected scope
- selected entities
- search query / search scope
- canvas nodes / edges
- focused element
- facts panel mode / location
- graph expansion history

The full payload itself remains in the Browser snapshot cache.
