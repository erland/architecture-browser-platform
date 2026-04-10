type WorkspaceLike = { id: string; status?: string | null };

type WorkspaceDataLike = {
  workspacesLoaded: boolean;
  workspaces: WorkspaceLike[];
  selectedWorkspaceId: string | null;
  workspaceDetailLoadedFor: string | null;
};

type SelectionLike = {
  selectedWorkspaceId: string | null;
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

export function resolveImplicitBrowserWorkspace(workspaces: WorkspaceLike[]) {
  const activeWorkspaces = workspaces.filter((workspace) => workspace.status !== 'ARCHIVED');
  return activeWorkspaces[0] ?? workspaces[0] ?? null;
}

export function resolveBrowserStartupTargetWorkspaceId({
  selection,
  workspaceData,
}: {
  selection: SelectionLike;
  workspaceData: WorkspaceDataLike;
}) {
  return selection.selectedWorkspaceId
    ?? workspaceData.selectedWorkspaceId
    ?? workspaceData.workspaces[0]?.id
    ?? null;
}

export function shouldShowBrowserStartupGate({
  workspaceData,
  startupTargetWorkspaceId,
  selectedSnapshot,
  browserBootstrap,
  browserSession,
}: {
  workspaceData: WorkspaceDataLike;
  startupTargetWorkspaceId: string | null;
  selectedSnapshot: unknown;
  browserBootstrap: BrowserBootstrapLike;
  browserSession: BrowserSessionLike;
}) {
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
}

export function resolveBrowserStartupGateMessage({
  workspaceData,
  startupTargetWorkspaceId,
  selectedSnapshot,
  browserBootstrap,
}: {
  workspaceData: WorkspaceDataLike;
  startupTargetWorkspaceId: string | null;
  selectedSnapshot: unknown;
  browserBootstrap: BrowserBootstrapLike;
}) {
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
}
