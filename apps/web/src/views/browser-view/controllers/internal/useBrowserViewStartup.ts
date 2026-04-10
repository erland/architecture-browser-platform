import { useEffect, useMemo } from 'react';
import {
  resolveBrowserStartupGateMessage,
  resolveBrowserStartupTargetWorkspaceId,
  resolveImplicitBrowserWorkspace,
  shouldShowBrowserStartupGate,
} from './browserViewStartupPolicy';

type WorkspaceLike = { id: string; status?: string | null };

type WorkspaceDataLike = {
  workspacesLoaded: boolean;
  workspaces: WorkspaceLike[];
  selectedWorkspaceId: string | null;
  workspaceDetailLoadedFor: string | null;
};

type SelectionLike = {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
};

type BrowserBootstrapLike = {
  status: string;
  message?: string | null;
};

type BrowserSessionLike = {
  state: {
    index: unknown;
  };
};

export function useBrowserViewStartup({
  selection,
  workspaceData,
  browserBootstrap,
  browserSession,
  selectedSnapshot,
}: {
  selection: SelectionLike;
  workspaceData: WorkspaceDataLike;
  browserBootstrap: BrowserBootstrapLike;
  browserSession: BrowserSessionLike;
  selectedSnapshot: unknown;
}) {
  const startupTargetWorkspaceId = useMemo(() => resolveBrowserStartupTargetWorkspaceId({
    selection,
    workspaceData,
  }), [selection.selectedWorkspaceId, workspaceData.selectedWorkspaceId, workspaceData.workspaces]);

  useEffect(() => {
    if (!selection.selectedWorkspaceId && workspaceData.workspaces.length > 0) {
      const implicitWorkspace = resolveImplicitBrowserWorkspace(workspaceData.workspaces);
      if (implicitWorkspace) {
        selection.setSelectedWorkspaceId(implicitWorkspace.id);
      }
    }
  }, [selection, workspaceData.workspaces]);

  const shouldShowGate = useMemo(() => shouldShowBrowserStartupGate({
    workspaceData,
    startupTargetWorkspaceId,
    selectedSnapshot,
    browserBootstrap,
    browserSession,
  }), [
    workspaceData,
    startupTargetWorkspaceId,
    selectedSnapshot,
    browserBootstrap,
    browserSession,
  ]);

  const gateMessage = useMemo(() => resolveBrowserStartupGateMessage({
    workspaceData,
    startupTargetWorkspaceId,
    selectedSnapshot,
    browserBootstrap,
  }), [
    workspaceData,
    startupTargetWorkspaceId,
    selectedSnapshot,
    browserBootstrap,
  ]);

  return {
    startupTargetWorkspaceId,
    shouldShowGate,
    gateMessage,
  };
}
