# Browser local refactor inventory (Step 1)

This note inventories the current Browser flow before introducing the local snapshot browser architecture from `architecture-browser-local-browser-step-by-step-plan.md`.

It is intentionally grounded in the current codebase so later steps can replace browser-specific server projections without losing behavior.

## Scope of this inventory

This document covers:

- current Browser-related frontend routes, views, hooks, and panels
- backend endpoints currently used to support Browser exploration
- shared snapshot-related frontend models and backend DTO areas
- how workspace/repository/snapshot selection is stored and propagated
- which user-visible browser behaviors must survive the refactor

It does **not** introduce the new payload contract, local cache, or Browser session store yet.

## Current user flow

Today the platform behaves like this:

1. The user selects a workspace.
2. The user selects a repository and/or snapshot via the shared selection context.
3. The **Snapshots** route acts as the explicit handoff into **Browser** or **Compare**.
4. The **Browser** route opens a dedicated shell, but its inner tools are still server-driven.
5. `useBrowserExplorer` issues separate backend calls for:
   - snapshot overview
   - layout tree
   - layout scope detail
   - dependency view
   - entry-point view
   - search view
   - entity detail
6. Browser tabs render those server-computed projections in focused panels.

So the route structure is already partially modernized, but the data flow is still backend projection driven rather than full-snapshot local browsing.

## Frontend routes and Browser entry points

### Route definitions

`apps/web/src/routing/appRoutes.ts`

Relevant routes:

- `/snapshots` — dedicated snapshot catalog and handoff into Browser or Compare
- `/browser` — focused browser shell with tabbed exploration tools
- `/compare` — dedicated comparison workflow using the selected snapshot as baseline
- `/legacy` — older stacked workflow still present as fallback/reference

### Snapshot handoff route

`apps/web/src/views/SnapshotsView.tsx`

Current responsibilities:

- loads workspace/repository/snapshot catalog context through `useWorkspaceData`
- shows the selected snapshot as the shared exploration target
- lets the user open:
  - Browser
  - Compare
  - Legacy stacked route
- makes snapshot selection explicit before Browser is opened

This route is the natural future place for preloading/caching the full snapshot payload before entering Browser.

### Browser route shell

`apps/web/src/views/BrowserView.tsx`

Current responsibilities:

- reads shared workspace/repository/snapshot selection from `AppSelectionContext`
- loads workspace/repository/snapshot lists through `useWorkspaceData`
- loads browser-specific exploration data through `useBrowserExplorer`
- keeps Browser tab selection in the URL via `browserTabState.ts`
- renders a Browser shell made up of:
  - compact Browser header
  - left rail with context + Browser tab navigation
  - main body for the active tab

Current Browser tabs:

- `OverviewTab`
- `LayoutTab`
- `DependenciesTab`
- `EntryPointsTab`
- `SearchTab`

This means Browser is already isolated as a dedicated route, but not yet as a dedicated local-analysis session/store.

## Frontend Browser modules currently participating in snapshot browsing

### Browser tab views

`apps/web/src/browser/`

- `OverviewTab.tsx`
- `LayoutTab.tsx`
- `DependenciesTab.tsx`
- `EntryPointsTab.tsx`
- `SearchTab.tsx`

These are thin Browser route subviews. They currently consume pre-derived data from `useBrowserExplorer` rather than deriving projections locally.

### Browser-specific panels/components

`apps/web/src/components/`

Main Browser-specific or Browser-adjacent components:

- `BrowserTabNav.tsx`
- `ContextHeader.tsx`
- `LayoutExplorerPanel.tsx`
- `DependencyPanel.tsx`
- `EntryPointPanel.tsx`
- `SearchDetailPanel.tsx`
- `SnapshotOverviewPanel.tsx`

Legacy stacked snapshot screen still composes many of the same panels through:

- `SnapshotCatalogSection.tsx`

That matters because some Browser behaviors are still duplicated between the dedicated Browser route and the legacy stacked route.

### Hooks/orchestration

`apps/web/src/hooks/`

#### `useBrowserExplorer.ts`

This is the main Browser orchestration hotspot.

Current responsibilities:

- chooses a snapshot if one is not explicitly selected
- loads snapshot overview
- loads layout tree + selected layout scope detail
- loads dependency view + focused dependency entity
- loads entry-point view + focused entry point
- loads search results + selected entity detail
- derives flattened layout scope options used by several tabs
- resets/retains per-tab focus state when scope/query changes

This hook is the main concentration of the old Browser architecture.

#### `useWorkspaceData.ts`

Shared workspace/repository/snapshot catalog hook used by multiple routes.

Current responsibilities relevant to Browser:

- loads workspaces, repositories, snapshots, operations/audit metadata
- resolves selected workspace/repository from shared context
- provides the snapshot list that Browser and Snapshots depend on

This hook should remain relevant after the refactor because workspace/repository/snapshot lifecycle is still a backend/platform concern.

#### `useSnapshotExplorer.ts`

Legacy stacked-screen hook.

Current responsibilities:

- reuses `useBrowserExplorer`
- adds customization and comparison orchestration on top
- feeds `SnapshotCatalogSection`

This is useful as a migration reference, but also a sign that Browser-specific concerns are still spread across both the dedicated Browser route and the legacy stacked flow.

## Shared selection storage and propagation

### Selection storage

`apps/web/src/contexts/AppSelectionContext.tsx`
`apps/web/src/routing/appSelectionState.ts`

Shared selection fields:

- `selectedWorkspaceId`
- `selectedRepositoryId`
- `selectedSnapshotId`

Persistence and propagation:

- stored in `localStorage` under `architecture-browser-platform.app-selection.v1`
- mirrored in URL query parameters:
  - `workspace`
  - `repository`
  - `snapshot`
- restored on load from local storage + URL search params
- synchronized on back/forward navigation through `popstate`

Selection rules:

- changing workspace clears repository and snapshot selection
- changing repository does **not** automatically clear snapshot
- changing snapshot updates the shared cross-route Browser/Compare/Legacy target

### Browser tab state

`apps/web/src/routing/browserTabState.ts`
`apps/web/src/routing/browserTabs.ts`

Browser-only tab selection is separately synchronized in the URL. This is independent from snapshot selection and should likely remain Browser-session specific in later steps.

## Backend endpoints currently supporting Browser exploration

### Snapshot catalog / shared snapshot retrieval

These are snapshot lifecycle/catalog endpoints that are broader than Browser and should likely remain after the refactor:

`apps/api/src/main/java/.../api/SnapshotCatalogResource.java`

- `GET /api/workspaces/{workspaceId}/snapshots`
- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/snapshots`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview`

Notes:

- `.../snapshots/{snapshotId}` is the most natural existing place to extend or complement with a future **full snapshot payload** endpoint.
- `.../overview` may survive as a compact summary endpoint, but the new Browser should not depend on it for detailed exploration.

### Browser-specific projection endpoints

These endpoints exist primarily to support the current Browser exploration model and are the main candidates for later removal/reduction once local browsing is in place.

#### Layout projections

`apps/api/src/main/java/.../api/SnapshotLayoutResource.java`

- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/tree`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/scopes/{scopeId}`

Backed by:

- `SnapshotLayoutExplorerService`

#### Dependency projections

`apps/api/src/main/java/.../api/SnapshotDependencyResource.java`

- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/dependencies`
  - query params: `scopeId`, `focusEntityId`, `direction`

Backed by:

- `SnapshotDependencyExplorerService`

#### Entry-point projections

`apps/api/src/main/java/.../api/SnapshotEntryPointResource.java`

- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/entry-points`
  - query params: `scopeId`, `focusEntityId`, `category`

Backed by:

- `SnapshotEntryPointExplorerService`

#### Search + entity detail projections

`apps/api/src/main/java/.../api/SnapshotSearchResource.java`

- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/search`
  - query params: `q`, `scopeId`, `limit`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/entities/{entityId}`

Backed by:

- `SnapshotSearchService`

### Browser-adjacent but not immediate removal targets

These are snapshot-related but not the primary target of the local-browser migration:

- `SnapshotComparisonResource` / `SnapshotComparisonService`
- `SnapshotCustomizationResource` / `SnapshotCustomizationService`

They may later integrate with the new Browser session, but they are not the Step 1 removal candidates.

## Shared contracts and models relevant to the migration

### Frontend models

`apps/web/src/appModel.ts`

Current Browser-facing model areas:

- `SnapshotSummary`
- `SnapshotOverview`
- `LayoutTree`
- `LayoutScopeDetail`
- `DependencyView`
- `EntryPointView`
- `SearchView`
- `EntityDetail`
- customization/comparison model types used by the legacy stacked flow

Observation:

The frontend already has typed models for all current server-derived Browser projections. Step 2 should add a **domain-oriented full snapshot payload model** beside these rather than trying to overload these projection models.

### Backend DTO areas

`apps/api/src/main/java/.../api/dto/`

Current relevant DTO groupings:

- `SnapshotDtos.java`
- `LayoutDtos.java`
- `DependencyDtos.java`
- `EntryPointDtos.java`
- `SearchDtos.java`
- `ComparisonDtos.java`
- `CustomizationDtos.java`

Observation:

The DTO structure already separates catalog/overview concerns from browser-specific projection concerns. That is a good seam for introducing a new full snapshot contract while leaving legacy projection endpoints temporarily intact.

### Shared library areas

Potentially relevant shared areas to revisit in later steps:

- `libs/contracts/`
- `libs/view-models/`

In the current repo state, the active Browser flow mainly uses `apps/web/src/appModel.ts` for web-side typing, so any new shared full-payload contract should be introduced deliberately rather than assumed to already exist in those libraries.

## Current Browser API dependency map

`apps/web/src/platformApi.ts`

Current Browser route dependencies:

- `getSnapshotOverview(...)`
- `getLayoutTree(...)`
- `getLayoutScopeDetail(...)`
- `getDependencyView(...)`
- `getEntryPointView(...)`
- `searchSnapshot(...)`
- `getEntityDetail(...)`

Current shared/non-Browser snapshot dependencies:

- `getWorkspaceSnapshots(...)`
- `getSnapshotComparison(...)`
- `getCustomizationOverview(...)`
- overlay / saved-view mutation endpoints

This file is the clearest single place to see the backend coupling the new Browser architecture needs to unwind.

## Behaviors that must survive the refactor

The local-browser migration must preserve these current user-visible capabilities.

### 1. Overview / orientation

Current source:

- `OverviewTab`
- `SnapshotOverviewPanel`
- `snapshotOverview` from `useBrowserExplorer`

Must survive as:

- lightweight orientation about what snapshot is open
- completeness/health context
- repository/source/run context
- not necessarily as a large separate tab forever, but still available in Browser

### 2. Scope navigation

Current source:

- `LayoutTab`
- `LayoutExplorerPanel`
- layout tree + scope detail endpoints

Must survive as:

- hierarchical navigation by scope/module/package/group
- ability to move from tree selection to focused content
- visibility into child scopes and contained entities

### 3. Search

Current source:

- `SearchTab`
- `SearchDetailPanel`
- search endpoint + entity detail endpoint

Must survive as:

- fast entity search
- optional scope narrowing
- ability to select a result and inspect its details
- relationship-aware drill-down from result/detail

### 4. Dependency exploration

Current source:

- `DependenciesTab`
- `DependencyPanel`
- dependency endpoint

Must survive as:

- inbound / outbound / all relationship inspection
- optional scope filtering
- focus on a selected entity
- visibility into related entities and relationship kinds

### 5. Entity facts / details

Current source:

- search entity detail view
- layout/dependency/entry-point panels exposing contextual entity summaries

Must survive as:

- focused facts/details panel for the selected entity or scope
- source references, metadata, summaries, relationship context

### 6. Entry-point / integration-oriented views

Current source:

- `EntryPointsTab`
- `EntryPointPanel`
- entry-point endpoint

Must survive initially unless the later design explicitly merges it into search/tree/canvas facts workflows.

For migration safety, treat this as preserved behavior even if the final UI shape changes.

## Migration seams and hotspots

### Highest priority refactor hotspots

1. `apps/web/src/hooks/useBrowserExplorer.ts`
   - current Browser orchestration “god hook”
   - mixes fetch orchestration with browser state
2. `apps/web/src/platformApi.ts`
   - central Browser/backend coupling point
3. `apps/api/src/main/java/.../service/snapshots/SnapshotLayoutExplorerService.java`
4. `apps/api/src/main/java/.../service/snapshots/SnapshotDependencyExplorerService.java`
5. `apps/api/src/main/java/.../service/snapshots/SnapshotEntryPointExplorerService.java`
6. `apps/api/src/main/java/.../service/snapshots/SnapshotSearchService.java`
7. `apps/web/src/views/BrowserView.tsx`
   - current shell that will later become a local-analysis workspace

### Stable seams that should help the migration

1. `SnapshotsView.tsx`
   - already acts as the handoff into Browser
2. `AppSelectionContext.tsx`
   - already centralizes selected snapshot propagation
3. `SnapshotCatalogResource.java`
   - natural place for a future full snapshot payload endpoint
4. `appRoutes.ts`
   - Browser/Compare/Operations already separated into dedicated routes

## Recommended next-step implications

This inventory suggests the safest Step 2+ path is:

1. add a full snapshot payload contract near the snapshot catalog/domain area
2. add browser-side storage/indexing without removing old endpoints yet
3. build a dedicated Browser session/store beside the current hook model
4. migrate Browser UI from server-derived tab data to local selectors
5. remove browser-only projection endpoints only after the local path is verified

## Verification notes for Step 1

This step is documentation/inventory only.

Recommended commands after any later code-affecting step:

```bash
npm run typecheck:web
npm run test:web -- --runInBand
```

If backend verification is needed in a later step, use the existing project-specific backend commands or dev/test stack flow already documented in the repo.
