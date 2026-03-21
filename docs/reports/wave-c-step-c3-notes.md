## Wave C — Step C3 notes

This step refactors `useSnapshotExplorer.ts` into a thinner composition hook.

Added modules:
- `apps/web/src/hooks/snapshotExplorer/useSnapshotExplorer.types.ts`
- `apps/web/src/hooks/snapshotExplorer/useSnapshotExplorerCustomization.ts`
- `apps/web/src/hooks/snapshotExplorer/useSnapshotExplorerFacade.ts`

Resulting ownership:
- **useSnapshotExplorer.ts** now mainly composes the browser explorer, customization flow, compare explorer, and final facade
- **useSnapshotExplorerCustomization.ts** owns customization API loading plus overlay/saved-view actions and local form state
- **useSnapshotExplorerFacade.ts** owns final return-object shaping
- **useSnapshotExplorer.types.ts** owns shared hook-local feedback types

Intent:
- no deliberate runtime behavior change
- reduce orchestration density in the root hook
- keep the external return contract stable for existing views/components
