# Remaining Frontend Cleanup — Step 1 Baseline Freeze

## Purpose

Freeze the current post-cleanup Browser-only baseline before removing the remaining unreachable frontend pieces.

This step does **not** change app behavior. It records:
- the active Browser-only execution path
- the frontend areas that are still intentionally retained
- the current deletion candidates for the next cleanup wave

## Active Browser-only flow

The current user-visible frontend flow is:

1. `apps/web/src/main.tsx`
2. `apps/web/src/App.tsx`
3. `apps/web/src/views/BrowserView.tsx`
4. Browser-local UI components such as:
   - `BrowserSourceTreeSwitcherDialog`
   - `BrowserTopSearch`
   - `BrowserNavigationTree`
   - `BrowserGraphWorkspace`
   - `BrowserFactsPanel`
   - `BrowserViewpointDialog`

The application shell is Browser-only. Legacy top-level routes are normalized into Browser instead of rendering separate frontend screens.

## Keep list for this cleanup wave

These areas are intentionally retained and are **not** deletion targets in this wave:

- Browser session/store/index code
- Browser graph workspace, facts/details panel, top search, viewpoint controls, and navigation tree
- source-tree dialog and source management flow
- implicit workspace support under the hood for repository/snapshot management
- saved-view related foundations until a separate save-canvas analysis is done

## Retain-for-now rationale for saved views

Saved-view related code stays in place for now because a future **save canvas** feature may reuse some or all of the same concepts.

This step does **not** assume that saved view is the final correct abstraction. It only freezes the decision that saved-view foundations should be reviewed separately before deletion.

## Current deletion candidate groups

The next cleanup wave is expected to focus on these categories:

1. obsolete route-state helper code
2. old explorer view-model helpers that are only test-reachable
3. unused snapshot-preparation hooks superseded by current Browser bootstrap
4. orphaned browser index helper files
5. unreachable customization UI that is separate from saved-view persistence/model
6. unreachable frontend API wrapper methods that are no longer called from the Browser-only shell

## Reference candidates noted for follow-up

Likely follow-up targets include files such as:
- `apps/web/src/routing/appRouteState.ts`
- `apps/web/src/dependencyViewModel.ts`
- `apps/web/src/entryPointViewModel.ts`
- `apps/web/src/searchViewModel.ts`
- `apps/web/src/hooks/useBrowserSnapshotPreparation.ts`
- `apps/web/src/hooks/useLocalSnapshotIndex.ts`
- `apps/web/src/hooks/useSnapshotCachePreload.ts`
- `apps/web/src/browserSnapshotIndex.shared.ts`
- `apps/web/src/components/CustomizationPanel.tsx`
- `apps/web/src/components/snapshotCatalogTypes.ts`

Retained for separate analysis before deletion:
- `apps/web/src/savedViewModel.ts`
- saved-view related portions of `apps/web/src/appModel.customization.ts`
- saved-view related methods in `apps/web/src/platformApi.ts`

## Verification checklist

The baseline freeze is considered complete when:

- `App.tsx` still renders Browser-only shell behavior
- `BrowserView.tsx` remains the active top-level view
- source-tree dialog flow is still present
- saved-view foundations are explicitly documented as retained for now
- the deletion candidate groups are documented for the next step

## Output of this step

This step adds:
- this baseline document
- a lightweight verification script/report entry for the current post-cleanup baseline

No frontend behavior changes are included in this step.
