import { useBrowserSavedCanvasController } from '../../saved-canvas-controller/useBrowserSavedCanvasController';
import { useBrowserViewDialogState } from '../useBrowserViewDialogState';
import type { BrowserViewWorkspaceController } from './useBrowserViewWorkspaceController';

/**
 * Owns BrowserView dialog surfaces and saved-canvas interaction wiring.
 * This keeps dialog composition out of the top-level screen controller.
 */
export function useBrowserViewDialogController({
  browserSession,
  selection,
  workspaceData,
  derivedState,
  sourceTreeController,
}: Pick<BrowserViewWorkspaceController, 'browserSession' | 'selection' | 'workspaceData' | 'derivedState' | 'sourceTreeController'>) {
  const savedCanvas = useBrowserSavedCanvasController({
    browserSession,
    selection,
    workspaceData,
    selectedSnapshot: derivedState.selectedSnapshot,
    selectedRepositoryId: derivedState.selectedRepository?.id ?? selection.selectedRepositoryId ?? null,
    selectedSnapshotLabel: derivedState.selectedSnapshotLabel,
  });

  const dialogState = useBrowserViewDialogState({ savedCanvas });

  return {
    savedCanvas,
    dialogs: {
      isSourceTreeSwitcherOpen: sourceTreeController.isSourceTreeSwitcherOpen,
      setIsSourceTreeSwitcherOpen: sourceTreeController.setIsSourceTreeSwitcherOpen,
      handleOpenSourceTreeDialog: sourceTreeController.handleOpenSourceTreeDialog,
      ...dialogState,
    },
  };
}

export type BrowserViewDialogController = ReturnType<typeof useBrowserViewDialogController>;
