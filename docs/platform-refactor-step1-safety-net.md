# Platform refactor step 1: establish the safety net

This step creates the baseline needed before splitting large files.

## Scope
The safety net for the first refactor pass focuses on the highest-priority hotspots from the refactoring analysis:

### Frontend hotspots
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/components/BrowserFactsPanel.tsx`

### Backend hotspots
- `apps/api/src/main/java/info/isaksson/erland/architecturebrowser/platform/service/snapshots/SnapshotSearchService.java`
- `apps/api/src/main/java/info/isaksson/erland/architecturebrowser/platform/service/snapshots/SnapshotCatalogService.java`

## Commands
From repository root:

```bash
npm run verify:safety-net
```

Manual equivalents:

```bash
npm run test:web
cd apps/api && mvn test
```

## Coverage map

### `browserSessionStore.ts`
Primary direct coverage:
- `apps/web/src/__tests__/browserSessionStore.test.ts`
- `apps/web/src/__tests__/browserSessionBootstrap.test.ts`

Important indirect/regression coverage:
- `apps/web/src/__tests__/browserArchitectureWorkflow.test.ts`
- `apps/web/src/__tests__/browserCompactUmlCanvasFixes.test.ts`
- `apps/web/src/__tests__/browserCompactUmlProjectionRegression.test.ts`
- `apps/web/src/__tests__/browserEntityFirstRegression.test.ts`
- `apps/web/src/__tests__/browserFactsPanel.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspaceModel.test.ts`
- `apps/web/src/__tests__/browserOverviewStrip.test.ts`
- `apps/web/src/__tests__/browserPersistenceEntityRelationsRegression.test.ts`
- `apps/web/src/__tests__/browserProjectionModel.test.ts`
- `apps/web/src/__tests__/browserViewpointPresentation.test.ts`
- `apps/web/src/__tests__/browserViewpointsRegression.test.ts`

### `browserSnapshotIndex.ts`
Primary direct coverage:
- `apps/web/src/__tests__/browserSnapshotIndex.test.ts`
- `apps/web/src/__tests__/browserSnapshotPreparation.test.ts`

Important indirect/regression coverage:
- `apps/web/src/__tests__/browserArchitectureWorkflow.test.ts`
- `apps/web/src/__tests__/browserCompactUmlCanvasFixes.test.ts`
- `apps/web/src/__tests__/browserCompactUmlProjectionRegression.test.ts`
- `apps/web/src/__tests__/browserEntityFirstRegression.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspaceModel.test.ts`
- `apps/web/src/__tests__/browserNavigationTree.test.ts`
- `apps/web/src/__tests__/browserPersistenceEntityRelationsRegression.test.ts`
- `apps/web/src/__tests__/browserProjectionModel.test.ts`
- `apps/web/src/__tests__/browserSessionBootstrap.test.ts`
- `apps/web/src/__tests__/browserSessionStore.test.ts`
- `apps/web/src/__tests__/browserTopSearch.test.ts`
- `apps/web/src/__tests__/browserViewpointControls.test.tsx`
- `apps/web/src/__tests__/browserViewpointPresentation.test.ts`
- `apps/web/src/__tests__/browserViewpointsRegression.test.ts`

### `BrowserFactsPanel.tsx`
Primary direct coverage:
- `apps/web/src/__tests__/browserFactsPanel.test.ts`

Important indirect/regression coverage:
- `apps/web/src/__tests__/browserArchitectureWorkflow.test.ts`
- `apps/web/src/__tests__/browserEntityFirstRegression.test.ts`
- `apps/web/src/__tests__/browserViewpointsRegression.test.ts`

### `SnapshotSearchService.java`
Primary endpoint coverage:
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotSearchResourceTest.java`

Contract inputs used by that coverage:
- `apps/api/src/test/resources/contracts/search-rich.json`
- `apps/api/src/test/resources/contracts/partial-result.json`
- `apps/api/src/test/resources/contracts/minimal-success.json`

### `SnapshotCatalogService.java`
Primary endpoint coverage:
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotCatalogResourceTest.java`

Important indirect coverage through dependent snapshot flows:
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotDependencyResourceTest.java`
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotEntryPointResourceTest.java`
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotLayoutResourceTest.java`
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotComparisonResourceTest.java`
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotCustomizationResourceTest.java`

Contract inputs used by that coverage:
- `apps/api/src/test/resources/contracts/layout-rich.json`
- `apps/api/src/test/resources/contracts/entry-rich.json`
- `apps/api/src/test/resources/contracts/compare-next.json`
- `apps/api/src/test/resources/contracts/viewpoint-rich.json`
- `apps/api/src/test/resources/contracts/viewpoints-curated.json`

## How to use this step during refactoring
For each subsequent refactor step:
1. run `npm run verify:safety-net`
2. if web or API tests fail, inspect the generated log under `docs/reports/`
3. fix the regression before continuing
4. keep behavior changes out of structural refactor commits whenever possible

## Notes
The safety-net script intentionally distinguishes three states:
- `PASS` — baseline command ran and succeeded
- `FAIL` — baseline command ran and failed
- `SKIPPED` — prerequisites for the baseline command were missing in the local environment

That makes environmental setup issues visible instead of letting them masquerade as regressions.
