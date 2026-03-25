/**
 * Coordinates browser-page orchestration for workspace loading, selection state,
 * startup gating, and view-level dialogs. Domain workflows such as saved-canvas
 * open/save/rebind stay behind dedicated controller modules.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyRepositoryForm, type Repository, type RepositoryUpdateRequest, type Workspace } from '../appModel';
import { platformApi } from '../platformApi';
import { getBrowserSnapshotCache } from '../snapshotCache';
import { buildSourceTreeLauncherItems, type SourceTreeLauncherItem } from '../appModel.sourceTree';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
import { useBrowserSessionBootstrap } from '../hooks/useBrowserSessionBootstrap';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { browserTabs } from '../routing/browserTabs';
import { useBrowserSavedCanvasController } from './useBrowserSavedCanvasController';
import { type BrowserViewProps } from './browserView.shared';
import { useBrowserViewActions } from './useBrowserViewActions';
import { useBrowserViewLayout } from './useBrowserViewLayout';

export type BrowserViewScreenController = ReturnType<typeof useBrowserViewScreenController>;

export function useBrowserViewScreenController(_: BrowserViewProps) {
  const [, setBusyMessage] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [isSourceTreeSwitcherOpen, setIsSourceTreeSwitcherOpen] = useState(false);
  const [isViewpointDialogOpen, setIsViewpointDialogOpen] = useState(false);

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

  const selectedSnapshot = useMemo(() => {
    if (selection.selectedSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === selection.selectedSnapshotId) ?? null;
    }

    const sessionSnapshotId = browserSession.state.activeSnapshot?.snapshotId;
    if (sessionSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === sessionSnapshotId) ?? null;
    }

    return null;
  }, [selection.selectedSnapshotId, browserSession.state.activeSnapshot?.snapshotId, workspaceData.snapshots]);

  const browserBootstrap = useBrowserSessionBootstrap({
    workspaceId: workspaceData.selectedWorkspaceId,
    repositoryId: selection.selectedRepositoryId,
    snapshot: selectedSnapshot,
  });

  const startupTargetWorkspaceId = selection.selectedWorkspaceId
    ?? workspaceData.selectedWorkspaceId
    ?? workspaceData.workspaces[0]?.id
    ?? null;

  const shouldShowStartupGate = useMemo(() => {
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

  const startupGateMessage = useMemo(() => {
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

  const selectedRepository = useMemo(() => {
    const bySelection = workspaceData.repositories.find((repository) => repository.id === selection.selectedRepositoryId);
    if (bySelection) {
      return bySelection;
    }
    if (!selectedSnapshot) {
      return null;
    }
    return workspaceData.repositories.find((repository) => repository.id === selectedSnapshot.repositoryRegistrationId) ?? null;
  }, [workspaceData.repositories, selection.selectedRepositoryId, selectedSnapshot]);

  useEffect(() => {
    if (!selection.selectedWorkspaceId && workspaceData.workspaces.length > 0) {
      const activeWorkspaces = workspaceData.workspaces.filter((workspace) => workspace.status !== 'ARCHIVED');
      const implicitWorkspace = activeWorkspaces[0] ?? workspaceData.workspaces[0] ?? null;
      if (implicitWorkspace) {
        selection.setSelectedWorkspaceId(implicitWorkspace.id);
      }
    }
  }, [selection.selectedWorkspaceId, selection.setSelectedWorkspaceId, workspaceData.workspaces]);

  const sourceTreeLauncherItems = useMemo(() => buildSourceTreeLauncherItems({
    workspace: workspaceData.selectedWorkspace,
    repositories: workspaceData.repositories,
    snapshots: workspaceData.snapshots,
  }), [workspaceData.selectedWorkspace, workspaceData.repositories, workspaceData.snapshots]);

  const handleSelectSourceTree = useCallback(async (item: SourceTreeLauncherItem) => {
    const cache = getBrowserSnapshotCache();
    selection.setSelectedWorkspaceId(item.workspaceId);

    const detail = workspaceData.selectedWorkspaceId === item.workspaceId
      ? { snapshotPayload: workspaceData.snapshots }
      : await workspaceData.loadWorkspaceDetail(item.workspaceId);

    const repositorySnapshots = (detail?.snapshotPayload ?? workspaceData.snapshots)
      .filter((snapshot) => snapshot.repositoryRegistrationId === item.repositoryId)
      .sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt));

    let preferredSnapshotId = item.latestSnapshotId;
    for (const snapshot of repositorySnapshots) {
      const record = await cache.getSnapshot(snapshot.id);
      if (cache.isSnapshotCurrent(snapshot, record)) {
        preferredSnapshotId = snapshot.id;
        break;
      }
    }

    selection.setSelectedRepositoryId(item.repositoryId);
    selection.setSelectedSnapshotId(preferredSnapshotId);
    setIsSourceTreeSwitcherOpen(false);
  }, [selection, workspaceData]);

  const handleInitializeImplicitWorkspace = useCallback(async () => {
    setBusyMessage('Initializing source tree catalog…');
    try {
      const created = await platformApi.createWorkspace<Workspace>({
        workspaceKey: 'default',
        name: 'Default source trees',
        description: 'Implicit Browser workspace for source tree registrations.',
      });
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(created.id);
      selection.setSelectedWorkspaceId(created.id);
      selection.setSelectedRepositoryId(null);
      selection.setSelectedSnapshotId(null);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  }, [selection, workspaceData]);

  const handleCreateRepositoryFromDialog = useCallback(async (payload: typeof emptyRepositoryForm) => {
    const workspaceId = workspaceData.selectedWorkspace?.id ?? selection.selectedWorkspaceId;
    if (!workspaceId) {
      return;
    }
    setBusyMessage(`Creating source tree ${payload.name || payload.repositoryKey}…`);
    try {
      const created = await platformApi.createRepository<Repository>(workspaceId, payload);
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(workspaceId);
      selection.setSelectedWorkspaceId(workspaceId);
      selection.setSelectedRepositoryId(created.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  }, [selection, workspaceData]);

  const handleRequestReindexFromDialog = useCallback(async (repository: Repository) => {
    const latestSnapshot = await workspaceData.handleRequestRun(repository, 'SUCCESS');
    selection.setSelectedWorkspaceId(repository.workspaceId);
    selection.setSelectedRepositoryId(repository.id);
    selection.setSelectedSnapshotId(latestSnapshot?.id ?? null);
  }, [selection, workspaceData]);

  const handleArchiveRepositoryFromDialog = useCallback(async (repository: Repository) => {
    await workspaceData.handleArchiveRepository(repository.id);
    if (selection.selectedRepositoryId === repository.id) {
      selection.setSelectedRepositoryId(null);
      selection.setSelectedSnapshotId(null);
    }
  }, [selection, workspaceData]);

  const handleUpdateRepositoryFromDialog = useCallback(async (repository: Repository, payload: RepositoryUpdateRequest) => {
    setBusyMessage(`Updating source tree ${payload.name || repository.name}…`);
    try {
      await platformApi.updateRepository<Repository>(repository.workspaceId, repository.id, payload);
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(repository.workspaceId);
      selection.setSelectedWorkspaceId(repository.workspaceId);
      selection.setSelectedRepositoryId(repository.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  }, [selection, workspaceData]);

  const repositoryLabel = selectedRepository?.name
    ?? selectedSnapshot?.repositoryName
    ?? selectedSnapshot?.repositoryKey
    ?? selectedSnapshot?.repositoryRegistrationId
    ?? '—';

  const activeTabMeta = browserTabs.find((tab) => tab.key === browserLayout.activeTab) ?? browserTabs[0];

  const selectedScopeLabel = useMemo(() => {
    if (!browserSession.state.index || !browserSession.state.selectedScopeId) {
      return null;
    }
    return browserSession.state.index.scopePathById.get(browserSession.state.selectedScopeId)
      ?? browserSession.state.selectedScopeId
      ?? null;
  }, [browserSession.state.index, browserSession.state.selectedScopeId]);

  const selectedSnapshotLabel = selectedSnapshot?.snapshotKey
    ?? browserSession.state.activeSnapshot?.snapshotKey
    ?? '—';

  const activeViewpointLabel = browserSession.state.appliedViewpoint?.viewpoint.title
    ?? browserSession.state.appliedViewpoint?.viewpoint.id
    ?? (browserSession.state.viewpointSelection.viewpointId ? `Viewpoint ${browserSession.state.viewpointSelection.viewpointId}` : 'Manual canvas');

  const browserActions = useBrowserViewActions({
    browserSession,
    activeTab: browserLayout.activeTab,
    setActiveTab: browserLayout.setActiveTab,
    topSearchScopeMode: browserLayout.topSearchScopeMode,
  });

  const savedCanvas = useBrowserSavedCanvasController({
    browserSession,
    selection,
    workspaceData,
    selectedSnapshot,
    selectedRepositoryId: selectedRepository?.id ?? selection.selectedRepositoryId ?? null,
    selectedSnapshotLabel,
  });

  const handleOpenSourceTreeDialog = useCallback(() => setIsSourceTreeSwitcherOpen(true), []);

  return {
    browserActions,
    browserLayout,
    browserSession,
    selection,
    workspaceData,
    selectedSnapshot,
    selectedRepository,
    sourceTreeLauncherItems,
    activeTabMeta,
    repositoryLabel,
    selectedScopeLabel,
    selectedSnapshotLabel,
    activeViewpointLabel,
    startup: {
      shouldShowGate: shouldShowStartupGate,
      gateMessage: startupGateMessage,
    },
    dialogs: {
      isSourceTreeSwitcherOpen,
      setIsSourceTreeSwitcherOpen,
      isViewpointDialogOpen,
      setIsViewpointDialogOpen,
      isSavedCanvasDialogOpen: savedCanvas.isSavedCanvasDialogOpen,
      setIsSavedCanvasDialogOpen: savedCanvas.setIsSavedCanvasDialogOpen,
      handleOpenSourceTreeDialog,
    },
    savedCanvas,
    handlers: {
      handleSelectSourceTree,
      handleInitializeImplicitWorkspace,
      handleCreateRepositoryFromDialog,
      handleRequestReindexFromDialog,
      handleArchiveRepositoryFromDialog,
      handleUpdateRepositoryFromDialog,
    },
  };
}
