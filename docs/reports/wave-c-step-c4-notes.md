## Wave C — Step C4 notes

This step performs a conservative final cleanup pass over the Wave C refactors.

Changes made:
- added `apps/web/src/hooks/snapshotExplorer/index.ts` as a barrel for the new snapshot-explorer submodules
- added `apps/web/src/hooks/snapshotExplorer/useSnapshotExplorer.shared.ts` for shared snapshot-explorer utility logic
- updated `apps/web/src/hooks/useSnapshotExplorer.ts` to consume the new barrel
- updated `apps/web/src/hooks/snapshotExplorer/useSnapshotExplorerCustomization.ts` to use the shared error-message helper
- applied a small readability cleanup in `apps/web/src/components/browserNavigationTree.state.ts`
- added this cleanup note

Intent:
- no deliberate runtime behavior change
- stabilize naming/import boundaries introduced in C1–C3
- reduce small bits of duplication before ending Wave C
