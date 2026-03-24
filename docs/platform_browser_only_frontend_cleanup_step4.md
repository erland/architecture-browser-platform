# Platform browser-only frontend cleanup — Step 4

## Goal
Remove Compare from the frontend so Browser remains the main analysis experience and source-management stays behind Browser.

## Changes applied
- Removed the `/compare` frontend route from the app route registry.
- Normalized legacy `/compare` URLs back to `/browser`.
- Removed `CompareView` from `App.tsx`.
- Deleted compare-specific frontend files:
  - `apps/web/src/views/CompareView.tsx`
  - `apps/web/src/hooks/useCompareExplorer.ts`
  - `apps/web/src/compareViewModel.ts`
  - `apps/web/src/components/ComparisonPanel.tsx`
  - `apps/web/src/__tests__/compareViewModel.test.ts`
- Updated route tests so Compare is treated as a browser-managed alias.

## Intentional non-changes
- Backend compare APIs and contracts are left in place for now.
- Operations remains as the only non-browser frontend route until a later cleanup step.
- Old dist output was not treated as source of truth for this cleanup step.

## Expected result
- The frontend no longer exposes a Compare screen.
- Visiting `/compare` routes the user into `/browser`.
- Compare-specific UI code is removed from the active frontend source tree.
