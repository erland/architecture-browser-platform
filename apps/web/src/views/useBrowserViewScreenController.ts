/**
 * Coordinates browser-page orchestration for workspace loading, selection state,
 * startup gating, and view-level dialogs. Domain workflows such as saved-canvas
 * open/save/rebind stay behind dedicated controller modules.
 */
import { useState } from 'react';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
import { useBrowserSessionBootstrap } from '../hooks/useBrowserSessionBootstrap';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useBrowserSavedCanvasController } from './useBrowserSavedCanvasController';
import { useBrowserViewDialogState } from './useBrowserViewDialogState';
import { type BrowserViewProps } from './browserView.shared';
import { useBrowserViewActions } from './useBrowserViewActions';
import { useBrowserViewDerivedState } from './useBrowserViewDerivedState';
import { useBrowserViewHandlers } from './useBrowserViewHandlers';
import { useBrowserViewLayout } from './useBrowserViewLayout';
import { useBrowserViewRepositoryActions } from './useBrowserViewRepositoryActions';
import { useBrowserViewSourceTreeController } from './useBrowserViewSourceTreeController';
import { useBrowserViewStartup } from './useBrowserViewStartup';
import { useBrowserViewSearchController } from './useBrowserViewSearchController';

export type BrowserViewScreenController = ReturnType<typeof useBrowserViewScreenController>;

export function useBrowserViewScreenController(_: BrowserViewProps) {
  const [, setBusyMessage] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);

  const selection = useAppSelectionContext();
  const browserSession = useBrowserSession();
  const browserLayout = useBrowserViewLayout();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    selectedSnapshotId: selection.selectedSnapshotId,
    setBusyMessage,
    setError,
  });

  const derivedState = useBrowserViewDerivedState({
    selection,
    workspaceData,
    browserSession,
    browserLayout,
  });

  const browserBootstrap = useBrowserSessionBootstrap({
    workspaceId: workspaceData.selectedWorkspaceId,
    repositoryId: selection.selectedRepositoryId,
    snapshot: derivedState.selectedSnapshot,
  });

  const startup = useBrowserViewStartup({
    selection,
    workspaceData,
    browserBootstrap,
    browserSession,
    selectedSnapshot: derivedState.selectedSnapshot,
  });

  const sourceTreeController = useBrowserViewSourceTreeController({
    selection,
    workspaceData,
  });

  const repositoryActions = useBrowserViewRepositoryActions({
    selection,
    workspaceData,
    setBusyMessage,
    setError,
  });

  const browserActions = useBrowserViewActions({
    browserSession,
    setActiveTab: browserLayout.setActiveTab,
    topSearchScopeMode: browserLayout.topSearchScopeMode,
  });

  const savedCanvas = useBrowserSavedCanvasController({
    browserSession,
    selection,
    workspaceData,
    selectedSnapshot: derivedState.selectedSnapshot,
    selectedRepositoryId: derivedState.selectedRepository?.id ?? selection.selectedRepositoryId ?? null,
    selectedSnapshotLabel: derivedState.selectedSnapshotLabel,
  });

  const handlers = useBrowserViewHandlers({
    sourceTreeController,
    repositoryActions,
  });

  const dialogs = useBrowserViewDialogState({ savedCanvas });
  const search = useBrowserViewSearchController({
    browserSession,
    browserActions,
    browserLayout,
  });

  return {
    browserActions,
    browserLayout,
    browserSession,
    selection,
    workspaceData,
    selectedSnapshot: derivedState.selectedSnapshot,
    selectedRepository: derivedState.selectedRepository,
    sourceTreeLauncherItems: sourceTreeController.sourceTreeLauncherItems,
    activeTabMeta: derivedState.activeTabMeta,
    repositoryLabel: derivedState.repositoryLabel,
    selectedScopeLabel: derivedState.selectedScopeLabel,
    selectedSnapshotLabel: derivedState.selectedSnapshotLabel,
    activeViewpointLabel: derivedState.activeViewpointLabel,
    startup: {
      shouldShowGate: startup.shouldShowGate,
      gateMessage: startup.gateMessage,
    },
    dialogs: {
      isSourceTreeSwitcherOpen: sourceTreeController.isSourceTreeSwitcherOpen,
      setIsSourceTreeSwitcherOpen: sourceTreeController.setIsSourceTreeSwitcherOpen,
      handleOpenSourceTreeDialog: sourceTreeController.handleOpenSourceTreeDialog,
      ...dialogs,
    },
    search,
    savedCanvas,
    handlers,
  };
}
