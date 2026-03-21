# Wave A2 — useWorkspaceData refactor

## Goal
Split `apps/web/src/hooks/useWorkspaceData.ts` into smaller orchestration units while preserving the existing public hook contract used by the route views.

## Result
The original hook is now a thin composition facade over focused internal modules:

- `apps/web/src/hooks/workspaceData/workspaceData.types.ts`
- `apps/web/src/hooks/workspaceData/workspaceData.helpers.ts`
- `apps/web/src/hooks/workspaceData/useWorkspaceDataState.ts`
- `apps/web/src/hooks/workspaceData/useWorkspaceDataLoaders.ts`
- `apps/web/src/hooks/workspaceData/useWorkspaceDataSelectionSync.ts`
- `apps/web/src/hooks/workspaceData/useWorkspaceDataActions.ts`

## Responsibility split
- **State**: owns React state and derived selections/maps.
- **Loaders**: owns read-side platform API loading and detail reset logic.
- **Selection sync**: owns startup loading and selected workspace/repository synchronization.
- **Actions**: owns write-side workflows and orchestration for forms/mutations.
- **Facade**: `useWorkspaceData.ts` preserves the old return shape for calling views.

## Notes
No route/component call sites were changed. The refactor is internal to the hook boundary.
