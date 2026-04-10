# Frontend Browser regression pass — Step 9

## Scope

This regression pass validates the Browser workflows most likely to be affected by the Step 1–8 frontend refactoring work:

- graph workspace rendering and interaction fixtures
- auto-layout behavior and regressions
- snapshot indexing
- facts panel rendering
- Browser derived state behavior
- saved-canvas workflows and session mapping
- boundary and stabilization guardrails

## Commands executed

```bash
npm run check:boundaries
npm run verify:frontend-consolidation:stabilization
npm run test:web -- --runTestsByPath \
  apps/web/src/__tests__/components/browserGraphWorkspace.test.ts \
  apps/web/src/__tests__/components/browserGraphWorkspaceRegressionFixtures.test.ts \
  apps/web/src/__tests__/browser-auto-layout/browserAutoLayout.test.ts \
  apps/web/src/__tests__/browser-auto-layout/browserAutoLayout.regression.test.ts \
  apps/web/src/__tests__/browser-snapshot/browserSnapshotIndex.test.ts \
  apps/web/src/__tests__/components/browserFactsPanel.test.tsx \
  apps/web/src/__tests__/views/browserViewDerivedState.test.tsx \
  apps/web/src/__tests__/saved-canvas/savedCanvasAcceptedRebinding.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasBrowserState.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasControllerActions.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasDialogWorkflows.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasEditTracking.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasLocalStore.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasModel.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasOpen.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasPersistenceWorkflows.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasRebinding.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasRebindingUi.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasRegressionFixtures.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasRemoteStore.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasSessionMapping.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasSnapshotAvailability.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasStableReferences.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasSync.test.ts \
  apps/web/src/__tests__/saved-canvas/savedCanvasSyncHandlers.test.ts
```

## Result summary

- `npm run check:boundaries` passed
- `npm run verify:frontend-consolidation:stabilization` passed
- Focused Browser regression pass passed
  - 25 test suites passed
  - 128 tests passed
  - 0 failures

## Suites covered

### Graph workspace
- `components/browserGraphWorkspace.test.ts`
- `components/browserGraphWorkspaceRegressionFixtures.test.ts`

### Auto-layout
- `browser-auto-layout/browserAutoLayout.test.ts`
- `browser-auto-layout/browserAutoLayout.regression.test.ts`

### Snapshot indexing and Browser derived state
- `browser-snapshot/browserSnapshotIndex.test.ts`
- `views/browserViewDerivedState.test.tsx`

### Facts panel
- `components/browserFactsPanel.test.tsx`

### Saved canvas
- `saved-canvas/savedCanvasAcceptedRebinding.test.ts`
- `saved-canvas/savedCanvasBrowserState.test.ts`
- `saved-canvas/savedCanvasControllerActions.test.ts`
- `saved-canvas/savedCanvasDialogWorkflows.test.ts`
- `saved-canvas/savedCanvasEditTracking.test.ts`
- `saved-canvas/savedCanvasLocalStore.test.ts`
- `saved-canvas/savedCanvasModel.test.ts`
- `saved-canvas/savedCanvasOpen.test.ts`
- `saved-canvas/savedCanvasPersistenceWorkflows.test.ts`
- `saved-canvas/savedCanvasRebinding.test.ts`
- `saved-canvas/savedCanvasRebindingUi.test.ts`
- `saved-canvas/savedCanvasRegressionFixtures.test.ts`
- `saved-canvas/savedCanvasRemoteStore.test.ts`
- `saved-canvas/savedCanvasSessionMapping.test.ts`
- `saved-canvas/savedCanvasSnapshotAvailability.test.ts`
- `saved-canvas/savedCanvasStableReferences.test.ts`
- `saved-canvas/savedCanvasSync.test.ts`
- `saved-canvas/savedCanvasSyncHandlers.test.ts`

## Notes

- No production code changes were required during this step.
- This step serves as a validation checkpoint after the Step 1–8 boundary and ownership refactorings.
- The repo snapshot used for this step required installing workspace dependencies locally with `npm ci` before running the checks.
