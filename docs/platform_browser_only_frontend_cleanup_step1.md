# Platform browser-only frontend cleanup — Step 1 baseline freeze

This step intentionally does **not** change the running product behavior. It freezes the current browser-first baseline, records the cleanup scope, and adds a repeatable verification entry point so the later removal steps can be done incrementally.

## Goal of this step

- preserve the current working browser-first version as the starting point for the cleanup
- document which frontend entry points stay, which are scheduled for removal later, and which internal concepts stay under the hood for now
- provide a lightweight baseline verification command before destructive cleanup starts

## What stays unchanged in Step 1

The current user-facing behavior is intentionally preserved:

- the app still normalizes unknown routes to `/browser`
- the Browser route remains the default entry route
- the Source tree dialog remains the browser-first management surface already available from `BrowserView`
- route-based screens such as Compare, Operations, Workspaces, and Manage sources still exist for now

## Browser-only cleanup target in plain language

After the full cleanup plan, the frontend should behave like this:

- one primary route: `/browser`
- one primary management surface: the Source tree dialog launched from Browser
- one implicit workspace model under the hood
- no user-facing top-level navigation for Compare, Operations, Workspaces, or route-based source management

## Current baseline entry-point inventory

### Keep

These are the browser-first entry points and support layers that remain the basis for the next steps.

#### Main browser shell
- `apps/web/src/App.tsx`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/views/BrowserViewCenterContent.tsx`
- `apps/web/src/views/BrowserViewPanels.tsx`

#### Browser-first interaction components
- `apps/web/src/components/BrowserSourceTreeLauncher.tsx`
- `apps/web/src/components/BrowserSourceTreeSwitcherDialog.tsx`
- `apps/web/src/components/BrowserNavigationTree.tsx`
- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/components/BrowserFactsPanel.tsx`
- `apps/web/src/components/BrowserTopSearch.tsx`
- `apps/web/src/components/BrowserViewpointControls.tsx`
- `apps/web/src/components/BrowserViewpointDialog.tsx`

#### Browser bootstrap, session, and local indexing
- `apps/web/src/hooks/useBrowserSessionBootstrap.ts`
- `apps/web/src/hooks/useBrowserSnapshotPreparation.ts`
- `apps/web/src/hooks/useLocalSnapshotIndex.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/browserSessionStore.*.ts`
- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/browserSnapshotIndex.*.ts`
- `apps/web/src/browserProjectionModel.ts`
- `apps/web/src/browserViewpointPresentation.ts`
- `apps/web/src/snapshotCache.ts`

#### Browser-oriented selection and source-tree loading
- `apps/web/src/contexts/AppSelectionContext.tsx`
- `apps/web/src/routing/appSelectionState.ts`
- `apps/web/src/hooks/useWorkspaceData.ts`
- `apps/web/src/platformApi.ts`
- `apps/web/src/appModel.sourceTree.ts`

### Remove later in this cleanup plan

These are still present in the baseline, but they are explicit removal targets for later steps.

#### Top-level route shell and navigation
- `apps/web/src/components/AppNavigation.tsx`
- browser-external hero/nav rendering inside `apps/web/src/App.tsx`

#### Route definitions scheduled for consolidation
- `/sources`
- `/workspaces`
- `/compare`
- `/operations`
- route aliases `/repositories` and `/snapshots`
- route metadata in `apps/web/src/routing/appRoutes.ts`

#### Route-first views planned for deletion or collapse
- `apps/web/src/views/ManageSourcesView.tsx`
- `apps/web/src/views/RepositoriesView.tsx`
- `apps/web/src/views/SnapshotsView.tsx`
- `apps/web/src/views/WorkspacesView.tsx`
- `apps/web/src/views/CompareView.tsx`
- `apps/web/src/views/OperationsView.tsx`

#### Route-only supporting components to review during later removal
- `apps/web/src/components/ComparisonPanel.tsx`
- `apps/web/src/components/OperationsAndAuditSection.tsx`
- `apps/web/src/components/RepositoryManagementSection.tsx`
- `apps/web/src/components/WorkspaceManagementSection.tsx`
- `apps/web/src/components/WorkspaceSidebar.tsx`
- `apps/web/src/components/WorkspaceDetailsSection.tsx`

### Keep under the hood for now

These concepts should remain available internally during the cleanup, even if they become less visible in the UI.

- workspace id in selection state and API calls
- repository and snapshot models
- workspace bootstrap behavior in `BrowserView`
- `useWorkspaceData` workspace/repository/snapshot loading helpers
- backend workspace/repository/snapshot endpoints currently consumed by the frontend

## Exact file touchpoints likely used in later steps

### Step 2 — remove top-level navigation
- `apps/web/src/App.tsx`
- `apps/web/src/components/AppNavigation.tsx`
- `apps/web/src/routing/appRoutes.ts`

### Step 3 — hide route-level source management behind Browser
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/components/BrowserSourceTreeSwitcherDialog.tsx`
- `apps/web/src/hooks/useWorkspaceData.ts`
- `apps/web/src/views/ManageSourcesView.tsx`
- `apps/web/src/views/RepositoriesView.tsx`
- `apps/web/src/views/SnapshotsView.tsx`

### Step 4 — remove Compare
- `apps/web/src/views/CompareView.tsx`
- `apps/web/src/components/ComparisonPanel.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/routing/appRoutes.ts`

### Step 5 — remove Operations / Audit
- `apps/web/src/views/OperationsView.tsx`
- `apps/web/src/components/OperationsAndAuditSection.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/routing/appRoutes.ts`

### Step 6 — collapse workspace UI to one implicit workspace model
- `apps/web/src/views/WorkspacesView.tsx`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/hooks/useWorkspaceData.ts`
- `apps/web/src/contexts/AppSelectionContext.tsx`

### Step 7 and beyond — remove dead route-first shells and normalize to Browser-only
- `apps/web/src/App.tsx`
- `apps/web/src/routing/appRoutes.ts`
- remaining route-only tests under `apps/web/src/__tests__/`

## Step-by-step plan list

The attached browser-only cleanup plan is the next working roadmap.

1. Freeze the current working browser-first baseline.
2. Remove global top-level app navigation.
3. Hide route-level source management behind Browser only.
4. Remove Compare from the frontend.
5. Remove Operations / Audit from the frontend.
6. Collapse workspace UI to a single implicit workspace model.
7. Delete dead route views and route-only helpers.
8. Simplify `App.tsx` into a Browser-only shell.
9. Clean up tests and fixtures.
10. Do final terminology and UX cleanup.

## Verification

From repository root:

```bash
npm run verify:browser-only-baseline
```

That command is intentionally lightweight:
- it records the route and view inventory expected at the frozen baseline
- it runs frontend checks only if local npm dependencies are installed
- it avoids claiming success when prerequisites are missing

Manual spot checks after installing dependencies:

```bash
npm install
npm run typecheck:web
npm run test:web -- --runTestsByPath   apps/web/src/__tests__/appRoutes.test.ts   apps/web/src/__tests__/browserSourceTreeLauncher.test.tsx   apps/web/src/__tests__/browserSourceTreeSwitcherDialog.test.tsx   apps/web/src/__tests__/manageSourcesView.test.tsx
```

## Expected outcome of Step 1

At the end of this step:

- there is no intentional behavior change yet
- the repository has an explicit written inventory for the cleanup
- later steps can remove route-first UI with a clearer baseline and a named verification command
