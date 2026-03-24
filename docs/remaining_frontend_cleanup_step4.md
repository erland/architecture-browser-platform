# Remaining frontend cleanup — Step 4

## Implemented step

Removed unused snapshot-preparation hooks that were no longer part of the live Browser bootstrap flow.

## Files removed

- `apps/web/src/hooks/useBrowserSnapshotPreparation.ts`
- `apps/web/src/hooks/useLocalSnapshotIndex.ts`
- `apps/web/src/hooks/useSnapshotCachePreload.ts`

## Why

The Browser-only shell now boots through the active Browser session/bootstrap path and no longer imports these alternate snapshot-preparation hooks.

## Notes

- No live Browser runtime imports referenced these hooks at this step.
- The browser snapshot preparation regression test was kept because it still validates cache/index preparation primitives that remain relevant to the current Browser flow.
- This step is frontend cleanup only; it does not change backend behavior.
