# Browser local continuation notes

This document is intended to be dropped into a future chat together with the latest zip so work can continue without hidden context.

## What was accomplished

The Browser was refactored from a backend-driven explorer into a local analysis workspace.

Completed capabilities:

- full snapshot payload contract on the backend
- IndexedDB-backed browser snapshot cache
- local in-memory snapshot indexes
- preparation-before-open snapshot flow
- dedicated Browser session/store
- full-screen Browser workspace shell
- left navigation tree
- top local search
- local graph canvas workspace
- local facts/details panel
- local canvas analysis interactions
- compact overview signals
- Browser route detached from server-computed explorer endpoints
- focused automated tests around the new architecture

## Current source of truth for Browser

Browser should now be understood as being driven by these layers, in this order:

1. full snapshot payload endpoint
2. local snapshot cache
3. local snapshot index
4. Browser session/store
5. Browser UI components

If a future change bypasses those layers and reintroduces Browser-specific server projections into `/browser`, it is moving against the current architecture.

## Files to inspect first in a future chat

For a quick architecture read:

- `docs/browser-local-refactor-summary.md`
- `docs/browser-local-only-browser.md`
- `docs/browser-automated-tests.md`

For the Browser runtime path:

- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/hooks/useBrowserSnapshotPreparation.ts`
- `apps/web/src/hooks/useBrowserSessionBootstrap.ts`
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/snapshotCache.ts`

For the main Browser UI pieces:

- `apps/web/src/components/BrowserNavigationTree.tsx`
- `apps/web/src/components/BrowserTopSearch.tsx`
- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/components/BrowserFactsPanel.tsx`
- `apps/web/src/components/BrowserOverviewStrip.tsx`

## Known architectural position

### Browser route

`/browser` is intended to be local-only from an exploration perspective.

It may still rely on backend lifecycle/catalog data indirectly through the surrounding app, but it should not call backend Browser-projection endpoints for:

- layout tree generation
- dependency projection
- entry-point projection
- search projection
- entity detail projection

### Backend

The backend should continue to own snapshot lifecycle and full payload delivery.

The old Browser-specific backend resources may still exist in code, but they are no longer part of the desired Browser route architecture.

## Good next work candidates

If work continues after Step 16, the most natural follow-on items are:

1. backend cleanup pass
   - remove obsolete Browser-only projection resources/services if unused
2. frontend cleanup pass
   - remove now-dead Browser explorer hook/components if unused elsewhere
3. BrowserView route-level rendering tests
   - explicit empty / not-prepared / ready states
4. interaction refinement
   - better graph layout options
   - more modeling-tool-like canvas manipulation
   - stronger keyboard navigation and shortcuts
5. UX polishing
   - denser facts rendering
   - improved relationship labeling
   - better selection breadcrumbs / recent history

## Suggested prompts for a new chat

Use one of these with the latest zip attached.

### Cleanup-focused

```text
Can you do a source code analysis of the attached architecture-browser-platform zip and identify which old Browser explorer frontend/backend pieces are now dead code after the Browser local refactor? Please produce a prioritized cleanup plan and then implement the first cleanup step.
```

### Browser polish focused

```text
The attached architecture-browser-platform zip contains a completed Browser local refactor through Step 16. Please analyze the Browser UX and propose the most valuable next improvements for the canvas, facts panel, and navigation workflow, then create a downloadable step-by-step plan.
```

### Testing focused

```text
The attached architecture-browser-platform zip contains a completed Browser local refactor through Step 16. Please analyze the current Browser test coverage and implement the next highest-value route-level/rendering tests.
```

### Continue implementation directly

```text
The attached architecture-browser-platform zip contains a completed Browser local refactor through Step 16. Please start by analyzing the Browser architecture and implement a backend/frontend cleanup pass that removes obsolete Browser-projection code which is no longer used.
```

## Verification reminder

Recommended checks after future changes:

```bash
npm ci
npm run test:web
npm run build:web
cd apps/api && mvn test
```
