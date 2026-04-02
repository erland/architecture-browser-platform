import { useState } from 'react';
import { useAppSelectionContext } from '../../../contexts/AppSelectionContext';
import { useBrowserSession } from '../../../contexts/BrowserSessionContext';
import { useBrowserSessionBootstrap } from '../../../hooks/useBrowserSessionBootstrap';
import { useWorkspaceData } from '../../../hooks/useWorkspaceData';
import { useBrowserViewDerivedState } from './internal/useBrowserViewDerivedState';
import { useBrowserViewHandlers } from './internal/useBrowserViewHandlers';
import { useBrowserViewRepositoryActions } from './internal/useBrowserViewRepositoryActions';
import { useBrowserViewSourceTreeController } from './internal/useBrowserViewSourceTreeController';
import { useBrowserViewStartup } from './internal/useBrowserViewStartup';
import { useBrowserViewLayout } from './internal/useBrowserViewLayout';

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
