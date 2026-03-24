# Step 3 — Move source management fully behind Browser

## What changed

This step removes route-level source-management and workspace-management entry points from the normal frontend flow.

### Frontend routing
- `/sources` now normalizes to `/browser`
- `/workspaces` now normalizes to `/browser`
- legacy source aliases `/repositories` and `/snapshots` now also normalize to `/browser`

### Browser shell
- `App.tsx` no longer renders `ManageSourcesView` or `WorkspacesView`
- Browser is now the only source-management entry point in the normal flow

### Browser launcher flow
- Browser empty-state and startup actions now open the **Source tree** dialog instead of navigating to route-level management screens
- Indexed-version and source-management actions remain available, but they are now reached from Browser only

## What stayed the same
- Compare and Operations routes remain available for now
- Source tree dialog still owns add/edit/create-workspace/re-index/archive actions
- Browser bootstrap and selection logic still use the same workspace/repository/snapshot state under the hood

## Verification intent
- Launch the app at `/browser`
- Confirm Browser can open the Source tree dialog
- Confirm open/add/edit/re-index/archive still happen without leaving Browser
- Confirm direct visits to `/sources`, `/repositories`, `/snapshots`, and `/workspaces` land on Browser
