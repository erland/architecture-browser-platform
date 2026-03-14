# Browser local continuation notes

This document is intended to be dropped into a future chat together with the latest zip so work can continue without hidden context.

## Current Browser position

The Browser is now both:

1. **local-first** in runtime architecture
2. **entity-first** in day-to-day analysis UX

That means the current intended model is:

- **Tree** = navigate structural scopes
- **Facts panel** = explain the selected scope and bridge into entity analysis
- **Canvas** = analyze entities and relationships

The Browser should not drift back toward either of these older mental models:

- backend-driven Browser projections for normal Browser interaction
- mixed scope/entity canvas behavior as the default UX

## What was accomplished

### Local-first Browser architecture

Completed capabilities:

- full snapshot payload contract on the backend
- IndexedDB-backed browser snapshot cache
- local in-memory snapshot indexes
- preparation-before-open snapshot flow
- dedicated Browser session/store
- full-screen Browser workspace shell
- local navigation tree
- local top search
- local graph canvas workspace
- local facts/details panel
- local canvas analysis interactions
- compact overview signals
- Browser route detached from server-computed explorer endpoints
- focused automated tests around the local architecture

### Entity-first Browser interaction model

Completed capabilities:

- centralized scope-to-entity resolution helpers in the snapshot index
- tree add behavior now adds primary entities by default instead of raw scope nodes
- facts panel now acts as the scope-to-entity bridge
- canvas toolbar is entity-first
- tree modes for technical snapshots:
  - filesystem
  - package
  - all scopes
- scope nodes on canvas demoted to advanced/debug usage
- search now separates:
  - scope navigation
  - scope add-to-analysis
- dedicated regression coverage for the entity-first model

## Current source of truth for Browser

Browser should now be understood as being driven by these layers, in this order:

1. full snapshot payload endpoint
2. local snapshot cache
3. local snapshot index
4. Browser session/store
5. Browser UI components

If a future change bypasses those layers and reintroduces Browser-specific server projections into `/browser`, it is moving against the current architecture.

If a future change starts letting UI components guess how scopes map to entities, it is also moving against the current architecture. That policy should stay centralized in the Browser snapshot index.

## Files to inspect first in a future chat

For a quick architecture read:

- `docs/browser-local-refactor-summary.md`
- `docs/browser-entity-first-browser-model.md`
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

For the key regression safety net:

- `apps/web/src/__tests__/browserEntityFirstRegression.test.ts`
- `apps/web/src/__tests__/browserNavigationTree.test.ts`
- `apps/web/src/__tests__/browserTopSearch.test.ts`
- `apps/web/src/__tests__/browserFactsPanel.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserSessionStore.test.ts`

## Current behavior policies

### Scope vs entity

- scopes are for structural navigation
- entities are for analysis on the canvas
- facts panel bridges between them

### Primary entity policy

Keep this centralized in `browserSnapshotIndex.ts`.

- `FILE` -> direct `MODULE` entity/entities
- `DIRECTORY` -> direct `MODULE` entities for files directly inside that directory
- `PACKAGE` -> package entity/entities
- `MODULE` scope -> direct `MODULE` entity/entities when still present

### Tree modes

- **Filesystem** = directory/file-oriented browsing
- **Package** = Java/package-oriented browsing
- **All scopes** = advanced/debug view

### Scope nodes on canvas

Scope nodes are still supported internally but are no longer the normal Browser workflow. They should stay behind explicit advanced/debug actions unless there is a deliberate UX reason to surface them again.

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

The entity-first refactor plan is now complete. The most natural next work candidates are:

1. Browser UX polish
   - denser facts rendering
   - clearer empty states
   - better search-result wording and shortcuts
2. canvas/layout improvements
   - stronger grouping of contained entities
   - better relationship labeling
   - additional layout presets
3. keyboard/history/navigation improvements
   - recent selection history
   - breadcrumbs
   - keyboard shortcuts
4. cleanup pass
   - remove dead Browser explorer paths if any still exist
   - trim leftover scope-first wording in UI/docs/tests
5. route-level Browser rendering tests
   - explicit no-workspace / no-snapshot / not-prepared / ready states

## Suggested prompts for a new chat

Use one of these with the latest zip attached.

### UX-polish focused

```text
Can you do a source code analysis of the attached architecture-browser-platform zip and identify the highest-value UX polish opportunities in the Browser now that the entity-first refactor is complete? Please prioritize low-risk improvements first and create a downloadable step-by-step plan.
```

### Cleanup-focused

```text
Can you do a source code analysis of the attached architecture-browser-platform zip and identify which old Browser explorer frontend/backend pieces are now dead code after the local-first and entity-first Browser refactors? Please give me a prioritized cleanup analysis.
```

### Continue implementation directly

```text
Can you do a source code analysis of the attached architecture-browser-platform zip, confirm the current Browser entity-first architecture, and then implement the highest-value Browser UX polish step you recommend first?
```
