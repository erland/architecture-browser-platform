# Step 7 — Platform API follow-up review

This step is analysis-only. No API methods were removed yet.

## Summary

The current frontend `platformApi.ts` surface is already narrowly aligned with the Browser-first application flow. I did not find clear unused API client methods in the active frontend after Steps 1–6.

That means there is **nothing obviously safe to delete from `apps/web/src/platformApi.ts` yet** without changing active Browser functionality.

## Methods still used by active Browser flow

### Workspace/repository/source tree management
- `getHealth`
- `listWorkspaces`
- `getWorkspaceRepositories`
- `getWorkspaceRuns`
- `getWorkspaceSnapshots`
- `createWorkspace`
- `updateWorkspace`
- `archiveWorkspace`
- `createRepository`
- `updateRepository`
- `archiveRepository`
- `requestRun`

These are used by:
- `apps/web/src/hooks/workspaceData/useWorkspaceDataLoaders.ts`
- `apps/web/src/hooks/workspaceData/useWorkspaceDataActions.ts`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/components/BrowserSourceTreeSwitcherDialog.tsx`

### Snapshot payload loading
- `getFullSnapshotPayload`

This is used by:
- `apps/web/src/savedCanvasOpen.ts`

### Saved canvas backend sync
- `listSavedCanvases`
- `getSavedCanvas`
- `createSavedCanvas`
- `updateSavedCanvas`
- `duplicateSavedCanvas`
- `deleteSavedCanvas`

These are used by:
- `apps/web/src/savedCanvasRemoteStore.ts`

## Current assessment

`platformApi.ts` no longer appears to carry the old explorer/comparison/operations-style client methods that were candidates for removal.

In other words, the likely stale frontend cleanup was in the app-model layer, not in the API client layer.

## Recommended next follow-up (analysis only)

If you want a later cleanup wave, the better targets are not unused API methods in `platformApi.ts`, but rather:

1. **Route compatibility aliases** in `apps/web/src/routing/appRoutes.ts`
   - low-value but harmless
   - can be removed once you no longer care about legacy deep links

2. **Workspace/source-tree complexity review**
   - not unused, but potentially more than you want long-term
   - relevant if you still want to collapse toward a single hard-coded workspace or simpler source-tree model

3. **Backend API surface review**
   - the backend may still expose larger platform-era endpoints
   - but the frontend client has already been narrowed substantially

## Result for Step 7

- No frontend API client deletions performed
- No code changes required
- Conclusion: keep `apps/web/src/platformApi.ts` as-is for now
