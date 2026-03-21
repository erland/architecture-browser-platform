import type { Dispatch, SetStateAction } from 'react';

export function buildSnapshotExplorerFacade<
  TBrowserExplorer extends Record<string, unknown>,
  TCustomization extends Record<string, unknown>,
  TCompareExplorer extends Record<string, unknown>,
>(
  browserExplorer: TBrowserExplorer,
  customization: TCustomization,
  compareExplorer: TCompareExplorer,
  selectedSnapshotId: string | null,
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>,
) {
  return {
    selectedSnapshotId,
    setSelectedSnapshotId,
    ...browserExplorer,
    ...customization,
    ...compareExplorer,
  };
}
