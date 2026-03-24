# Platform browser-only frontend cleanup — Step 7

## Step implemented
Delete dead route views and route-only helpers.

## What was removed

The frontend no longer keeps source files that only existed to support the retired route-based screens.

Deleted route views:
- `apps/web/src/views/ManageSourcesView.tsx`
- `apps/web/src/views/RepositoriesView.tsx`
- `apps/web/src/views/SnapshotsView.tsx`
- `apps/web/src/views/WorkspacesView.tsx`

Deleted route-only helper components:
- `apps/web/src/components/ContextHeader.tsx`
- `apps/web/src/components/WorkspaceSidebar.tsx`

Deleted obsolete placeholder test:
- `apps/web/src/__tests__/manageSourcesView.test.tsx`

## Why this is safe

These files were no longer referenced by `App.tsx` or the Browser-first flow after the previous cleanup steps:
- source management had already moved behind `BrowserView`
- Compare had already been removed from the frontend
- Operations / Audit had already been removed from the frontend
- workspace handling had already been collapsed to one implicit workspace in the Browser-facing UX

This step only removes dead files that were left behind from the earlier multi-route shell.

## What remains for later steps

Routing normalization still exists so old URLs continue to land on `/browser`.
That final Browser-only shell simplification is left for the next cleanup step.
