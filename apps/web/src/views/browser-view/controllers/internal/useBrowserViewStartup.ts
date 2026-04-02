import { useEffect, useMemo } from 'react';

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
  const startupTargetWorkspaceId = selection.selectedWorkspaceId
    ?? workspaceData.selectedWorkspaceId
    ?? workspaceData.workspaces[0]?.id
    ?? null;

  useEffect(() => {
    if (!selection.selectedWorkspaceId && workspaceData.workspaces.length > 0) {
      const activeWorkspaces = workspaceData.workspaces.filter((workspace) => workspace.status !== 'ARCHIVED');
      const implicitWorkspace = activeWorkspaces[0] ?? workspaceData.workspaces[0] ?? null;
      if (implicitWorkspace) {
        selection.setSelectedWorkspaceId(implicitWorkspace.id);
      }
    }
  }, [selection, workspaceData.workspaces]);

  const shouldShowGate = useMemo(() => {
    if (!workspaceData.workspacesLoaded) {
      return true;
    }

    if (workspaceData.workspaces.length === 0) {
      return false;
    }

    if (!startupTargetWorkspaceId) {
      return true;
    }

    if (workspaceData.workspaceDetailLoadedFor !== startupTargetWorkspaceId) {
      return true;
    }

    if (selectedSnapshot && browserBootstrap.status === 'loading' && !browserSession.state.index) {
      return true;
    }

    return false;
  }, [
    workspaceData.workspacesLoaded,
    workspaceData.workspaces.length,
    workspaceData.workspaceDetailLoadedFor,
    startupTargetWorkspaceId,
    selectedSnapshot,
    browserBootstrap.status,
    browserSession.state.index,
  ]);

  const gateMessage = useMemo(() => {
    if (!workspaceData.workspacesLoaded) {
      return 'Loading source trees…';
    }
    if (workspaceData.workspaces.length > 0 && !startupTargetWorkspaceId) {
      return 'Opening source tree catalog…';
    }
    if (startupTargetWorkspaceId && workspaceData.workspaceDetailLoadedFor !== startupTargetWorkspaceId) {
      return 'Loading indexed versions…';
    }
    if (selectedSnapshot && browserBootstrap.status === 'loading') {
      return browserBootstrap.message ?? 'Preparing Browser…';
    }
    return 'Opening Browser…';
  }, [
    workspaceData.workspacesLoaded,
    workspaceData.workspaces.length,
    startupTargetWorkspaceId,
    workspaceData.workspaceDetailLoadedFor,
    selectedSnapshot,
    browserBootstrap.status,
    browserBootstrap.message,
  ]);

  return {
    startupTargetWorkspaceId,
    shouldShowGate,
    gateMessage,
  };
}
