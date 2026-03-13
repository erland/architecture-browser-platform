# Browser local refactor summary

This document summarizes the Browser refactor completed through Step 16.

## Goal

Move the Browser from a backend-projected explorer to a local analysis workspace where snapshot browsing is driven by:

- one full snapshot payload download
- browser-side IndexedDB caching
- local in-memory indexes/selectors
- a dedicated Browser session/store
- a workspace layout centered on tree + top search + canvas + facts

## Final architecture

### Backend responsibilities

The backend remains responsible for:

- workspace / repository / run / snapshot lifecycle
- importing and storing snapshots
- serving the stable full snapshot payload contract
- non-Browser administration and catalog workflows

The backend is no longer required to drive Browser-specific projections for the `/browser` route.

### Frontend responsibilities

The web client now owns Browser exploration behavior:

- snapshot preparation before opening Browser
- cached full snapshot storage in IndexedDB
- local snapshot index construction
- Browser session bootstrap and persisted view state
- local tree navigation
- local top search
- local graph/canvas interactions
- local facts/details rendering
- compact overview signals

## Step-by-step completion status

### Step 1 — Baseline and inventory the current browser flow

Completed.

Primary output:
- `docs/browser-local-refactor-inventory.md`

### Step 2 — Add a stable full snapshot payload contract

Completed.

Primary outputs:
- backend full snapshot endpoint
- frontend full snapshot API/types
- `docs/browser-full-snapshot-contract.md`

### Step 3 — Introduce browser-side snapshot storage using IndexedDB

Completed.

Primary outputs:
- `apps/web/src/snapshotCache.ts`
- `docs/browser-snapshot-cache.md`

### Step 4 — Build local in-memory indexes for browser exploration

Completed.

Primary outputs:
- `apps/web/src/browserSnapshotIndex.ts`
- `docs/browser-local-indexes.md`

### Step 5 — Migrate snapshot selection flow to preload browser data

Completed.

Primary outputs:
- snapshot preparation flow before Browser navigation
- `docs/browser-snapshot-preparation.md`

### Step 6 — Create a dedicated Browser session/store

Completed.

Primary outputs:
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `docs/browser-session-store.md`

### Step 7 — Redesign Browser route as a full-screen analysis workspace

Completed.

Primary output:
- `docs/browser-fullscreen-shell.md`

### Step 8 — Implement the left navigation tree

Completed.

Primary outputs:
- `apps/web/src/components/BrowserNavigationTree.tsx`
- `docs/browser-left-navigation-tree.md`

### Step 9 — Implement local search at the top of Browser

Completed.

Primary outputs:
- `apps/web/src/components/BrowserTopSearch.tsx`
- `docs/browser-top-search.md`

### Step 10 — Introduce the canvas graph workspace

Completed.

Primary outputs:
- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/browserGraphWorkspaceModel.ts`
- `docs/browser-canvas-workspace.md`

### Step 11 — Implement facts/details panel

Completed.

Primary outputs:
- `apps/web/src/components/BrowserFactsPanel.tsx`
- `docs/browser-facts-details-panel.md`

### Step 12 — Add canvas interaction patterns that support architecture analysis

Completed.

Primary output:
- `docs/browser-canvas-interactions.md`

### Step 13 — Reintroduce overview information in Browser without restoring the old clutter

Completed.

Primary outputs:
- `apps/web/src/components/BrowserOverviewStrip.tsx`
- `docs/browser-overview-signals.md`

### Step 14 — Remove Browser’s dependence on server-computed browser endpoints

Completed.

Primary output:
- `docs/browser-local-only-browser.md`

### Step 15 — Add focused automated tests for the new browser architecture

Completed.

Primary output:
- `docs/browser-automated-tests.md`

### Step 16 — Update documentation and create continuation notes for future chats

Completed by this handoff.

Primary outputs:
- `docs/browser-local-refactor-summary.md`
- `docs/browser-local-continuation-notes.md`

## Current Browser behavior

The Browser route now behaves as a local workspace:

1. User selects a snapshot from the snapshot flow.
2. The app prepares Browser data before navigation.
3. The full snapshot payload is cached locally.
4. Local indexes are built from the cached payload.
5. Browser bootstraps a session from the prepared local data.
6. The user explores the snapshot using:
   - left tree
   - top search
   - canvas
   - facts panel
   - compact overview strip

## Important code seams

### Full snapshot contract

- backend snapshot contract/resource/service area
- frontend `platformApi.ts`
- frontend `appModel.ts`

### Local cache and index

- `apps/web/src/snapshotCache.ts`
- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/hooks/useSnapshotCachePreload.ts`
- `apps/web/src/hooks/useLocalSnapshotIndex.ts`

### Browser session and bootstrap

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `apps/web/src/hooks/useBrowserSessionBootstrap.ts`
- `apps/web/src/hooks/useBrowserSnapshotPreparation.ts`

### Browser UI

- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/components/BrowserNavigationTree.tsx`
- `apps/web/src/components/BrowserTopSearch.tsx`
- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/components/BrowserFactsPanel.tsx`
- `apps/web/src/components/BrowserOverviewStrip.tsx`

## What is still intentionally left in place

The backend Browser-explorer resources still exist in the API codebase even though `/browser` no longer depends on them. They were left in place to avoid premature backend cleanup while the Browser route was being migrated.

Potential future cleanup candidates include:

- removing obsolete backend Browser projection resources/services entirely
- deleting now-unused frontend explorer hook/components if nothing else depends on them
- adding route-level DOM/render tests for BrowserView
- refining graph layout and modeling-tool interactions further

## Recommended verification commands

From repository root:

```bash
npm ci
npm run test:web
npm run build:web
cd apps/api && mvn test
```

For a direct frontend type build when the local npm shim is problematic:

```bash
node ../../node_modules/typescript/bin/tsc -b --pretty false
```
