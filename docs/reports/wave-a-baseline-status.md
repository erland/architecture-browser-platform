# Wave A baseline status

This file records the Wave A starting baseline for the next refactor steps:

- `apps/web/src/hooks/useWorkspaceData.ts`
- `apps/api/src/main/java/**/OperationsAdminService.java`
- `apps/api/src/main/java/**/SnapshotDependencyExplorerService.java`

It is intended to satisfy Step A1 in `platform_refactor_wave_abc_plan.md` by recording:

- current typecheck and test status
- directly relevant regression tests
- any already failing or blocked checks observed from the packaged repository

## Commands checked

### Web typecheck
```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
```

### Web targeted regression tests
```bash
cd apps/web
npm test -- --runTestsByPath \
  src/__tests__/appRouteState.test.ts \
  src/__tests__/appRoutes.test.ts \
  src/__tests__/appSelectionState.test.ts \
  src/__tests__/platformApi.test.ts \
  src/__tests__/operationsViewModel.test.ts \
  src/__tests__/dependencyViewModel.test.ts
```

### API tests
```bash
cd apps/api
mvn test
```

## Observed status from the packaged repository

### Web typecheck
**Status:** PASS

Observed from the packaged repository in this packaging environment:

```text
cd apps/web
npx tsc -p tsconfig.json --noEmit
# exited successfully
```

Interpretation:
- the current Wave A starting point is TypeScript-clean at the full web-app level
- this is the strongest directly observed baseline available in the packaged environment

### Web targeted regression tests
**Status:** BLOCKED IN PACKAGED ENVIRONMENT

Observed result:
- the repository contains `apps/web/node_modules`, but the configured web test command resolves Jest from `../../node_modules/jest/bin/jest.js`
- the packaged repository does not include a root-level `node_modules/jest/bin/jest.js`
- because of that, the targeted Jest run cannot start in this environment

Observed error summary:

```text
Error: Cannot find module '/mnt/data/platform_src/node_modules/jest/bin/jest.js'
```

Interpretation:
- this is an environment/setup blocker in the unpacked package, not evidence of a product regression in the Wave A targets
- run `npm install` from the repository root on a developer machine before using the Jest safety net

### API tests
**Status:** BLOCKED IN PACKAGED ENVIRONMENT

Observed result:
- `mvn` is not installed in the execution environment used for this packaging step
- backend tests therefore could not be executed from the package here

Observed error summary:

```text
bash: line 1: mvn: command not found
```

Interpretation:
- API baseline status still needs to be confirmed on a developer machine with Maven installed
- the packaged environment does not provide a trustworthy pass/fail result for backend behavior

## Directly relevant regression tests for Wave A

### Web: nearest guards for `useWorkspaceData.ts`
There is no dedicated `useWorkspaceData` test file in the current suite, so the nearest guards are the route/state/API tests that exercise the same data flow boundaries:

- `apps/web/src/__tests__/appRouteState.test.ts`
  - protects route-state transitions that determine which workspace/snapshot/repository screens are active
- `apps/web/src/__tests__/appRoutes.test.ts`
  - protects top-level route wiring for the views that consume `useWorkspaceData`
- `apps/web/src/__tests__/appSelectionState.test.ts`
  - protects workspace/repository/snapshot selection state used by the hook-driven screens
- `apps/web/src/__tests__/platformApi.test.ts`
  - protects the HTTP client boundary that `useWorkspaceData.ts` orchestrates
- `apps/web/src/__tests__/operationsViewModel.test.ts`
  - protects shaping of operations-facing data used in the operations flow
- `apps/web/src/__tests__/dependencyViewModel.test.ts`
  - indirectly useful because browser/selection flows commonly depend on shared snapshot selection and explorer state conventions

### API: direct guards for `OperationsAdminService.java`
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/OperationsAdminResourceTest.java`
  - `operationsOverviewShowsFailedRunsAndFailedSnapshots`
  - `retentionPreviewAndApplyDeleteOlderSnapshotsAndRunsSafely`

These are the primary backend guards for:
- operations overview assembly
- retention preview behavior
- retention apply/cleanup behavior
- audit-event side effects after retention apply

### API: direct guards for `SnapshotDependencyExplorerService.java`
- `apps/api/src/test/java/info/isaksson/erland/architecturebrowser/platform/api/SnapshotDependencyResourceTest.java`
  - `dependencyViewSupportsScopeFilteringAndEntityFocus`
  - `dependencyViewSupportsDirectionalFiltering`

These are the primary backend guards for:
- dependency scope filtering
- focus-entity resolution
- directional filtering
- summary/relationship counts and response shaping

## Already failing tests or blocked checks

Observed in the packaged repository:

- no failing web typecheck issues were observed
- no executable Jest result was observed because the packaged repo lacks the root Jest installation expected by the test script
- no executable Maven result was observed because Maven is not installed in the packaging environment

So the current explicit baseline is:
- **web typecheck:** passing
- **web Jest safety net:** blocked by missing root `node_modules`
- **API Maven safety net:** blocked by missing `mvn`

## Recommended local verification before Step A2

From repository root on a developer machine:

```bash
npm install
```

Then:

```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
npm test -- --runTestsByPath \
  src/__tests__/appRouteState.test.ts \
  src/__tests__/appRoutes.test.ts \
  src/__tests__/appSelectionState.test.ts \
  src/__tests__/platformApi.test.ts \
  src/__tests__/operationsViewModel.test.ts \
  src/__tests__/dependencyViewModel.test.ts
```

And:

```bash
cd apps/api
mvn test
```

## Expected use of this file in the next steps

- Step A2 should treat the web typecheck as the minimum gate to preserve continuously
- Step A3 should keep `OperationsAdminResourceTest` green
- Step A4 should keep `SnapshotDependencyResourceTest` green
- after Wave A, this file can be updated or superseded by a Wave A cleanup verification note
