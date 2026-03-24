# Remaining frontend cleanup — Step 7

## What changed

This step trims `apps/web/src/platformApi.ts` down to the Browser-only frontend surface that still has live runtime call sites.

Removed unreachable frontend API wrapper methods:
- `getSnapshotOverview`
- `getLayoutTree`
- `getLayoutScopeDetail`
- `getDependencyView`
- `getEntryPointView`
- `searchSnapshot`
- `getEntityDetail`
- `getCustomizationOverview`
- `createOverlay`
- `deleteOverlay`

Kept intentionally:
- Browser-only source tree catalog methods
- full snapshot payload loading
- repository/run actions
- saved-view related API methods for possible future canvas persistence

## Test cleanup

`platformApi.test.ts` was narrowed to cover only the API methods that remain in active frontend use or are intentionally retained in this cleanup wave.
