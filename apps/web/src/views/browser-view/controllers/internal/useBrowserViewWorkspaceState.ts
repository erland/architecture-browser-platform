import { useState } from 'react';
import { useAppSelectionContext } from '../../../../contexts/AppSelectionContext';
import { useBrowserSession } from '../../../../contexts/BrowserSessionContext';
import { useWorkspaceData } from '../../../../hooks/useWorkspaceData';
import { useBrowserViewLayout } from './useBrowserViewLayout';

/**
 * Owns the BrowserView workspace-level state dependencies.
 *
 * Keep selection-context access, browser-session access, BrowserView layout, and
 * workspace data loading together here so the top-level workspace controller can
 * stay focused on composing higher-level BrowserView workflows.
 */
export function useBrowserViewWorkspaceState() {
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

  return {
    selection,
    browserSession,
    browserLayout,
    workspaceData,
    setBusyMessage,
    setError,
  };
}

export type BrowserViewWorkspaceState = ReturnType<typeof useBrowserViewWorkspaceState>;
