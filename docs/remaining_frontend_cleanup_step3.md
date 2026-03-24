# Remaining Frontend Cleanup — Step 3

## Step
Remove old explorer view-model helpers that are only test-reachable.

## Changes made

Removed unused frontend helper modules that were no longer imported by the Browser-only runtime flow and were only referenced by isolated unit tests:

- `apps/web/src/dependencyViewModel.ts`
- `apps/web/src/entryPointViewModel.ts`
- `apps/web/src/searchViewModel.ts`

Removed the corresponding obsolete tests:

- `apps/web/src/__tests__/dependencyViewModel.test.ts`
- `apps/web/src/__tests__/entryPointViewModel.test.ts`
- `apps/web/src/__tests__/searchViewModel.test.ts`

## Notes

- The Browser-only runtime keeps using the browser-local snapshot index, session store, search, canvas, facts panel, and viewpoint model.
- This step does not remove explorer-related shared types from `appModel.explorers.ts`; it only removes the orphaned helper modules that were no longer part of the active frontend execution path.
- Backend endpoints remain unchanged.
