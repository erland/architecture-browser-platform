import { useState } from 'react';
import { useAppSelectionContext } from '../../../contexts/AppSelectionContext';
import { useBrowserSession } from '../../../contexts/BrowserSessionContext';
import { useBrowserSessionBootstrap } from '../../../hooks/useBrowserSessionBootstrap';
import { useWorkspaceData } from '../../../hooks/useWorkspaceData';
import { useBrowserViewDerivedState } from '../useBrowserViewDerivedState';
import { useBrowserViewHandlers } from '../useBrowserViewHandlers';
import { useBrowserViewRepositoryActions } from '../useBrowserViewRepositoryActions';
import { useBrowserViewSourceTreeController } from '../useBrowserViewSourceTreeController';
import { useBrowserViewStartup } from '../useBrowserViewStartup';
import { useBrowserViewLayout } from '../useBrowserViewLayout';

/**
 * Owns workspace, repository, snapshot, and startup orchestration for BrowserView.
 * This controller is the single place where BrowserView page composition touches
 * application selection context and workspace-loading hooks.
 */
export function useBrowserViewWorkspaceController() {
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

  const handlers = useBrowserViewHandlers({
    sourceTreeController,
    repositoryActions,
  });

  return {
    selection,
    browserSession,
    browserLayout,
    workspaceData,
    derivedState,
    startup,
    sourceTreeController,
    repositoryActions,
    handlers,
  };
}

export type BrowserViewWorkspaceController = ReturnType<typeof useBrowserViewWorkspaceController>;
