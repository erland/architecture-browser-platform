import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SnapshotSummary } from '../../app-model';
import type { SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';
import { createEmptyBrowserSessionState } from '../../browserSessionStore';

let mockSelection: any;
let mockBrowserSession: any;
let mockBrowserLayout: any;
let mockWorkspaceData: any;
let mockBootstrap: any;
let mockSavedCanvasController: any;
let mockBrowserActions: any;
let mockSnapshotCache: any;

jest.mock('../../contexts/AppSelectionContext', () => ({
  useAppSelectionContext: () => mockSelection,
}));

jest.mock('../../contexts/BrowserSessionContext', () => ({
  useBrowserSession: () => mockBrowserSession,
}));

jest.mock('../../hooks/useWorkspaceData', () => ({
  useWorkspaceData: () => mockWorkspaceData,
}));

jest.mock('../../hooks/useBrowserSessionBootstrap', () => ({
  useBrowserSessionBootstrap: () => mockBootstrap,
}));

jest.mock('../../views/saved-canvas-controller/useBrowserSavedCanvasController', () => ({
  useBrowserSavedCanvasController: () => mockSavedCanvasController,
}));

jest.mock('../../views/browser-view/useBrowserViewActions', () => ({
  useBrowserViewActions: () => mockBrowserActions,
}));

jest.mock('../../views/browser-view/useBrowserViewLayout', () => ({
  useBrowserViewLayout: () => mockBrowserLayout,
}));

jest.mock('../../api/snapshotCache', () => ({
  getBrowserSnapshotCache: () => mockSnapshotCache,
}));

import { useBrowserViewScreenController } from '../../views/browser-view/useBrowserViewScreenController';

function buildSnapshot(id: string, importedAt: string): SnapshotSummary {
  return {
    id,
    workspaceId: 'ws-1',
    repositoryRegistrationId: 'repo-1',
    repositoryKey: 'platform',
    repositoryName: 'Platform',
    runId: `run-${id}`,
    snapshotKey: `${id}-key`,
    status: 'READY',
    completenessStatus: 'COMPLETE',
    derivedRunOutcome: 'SUCCESS',
    schemaVersion: '1.0.0',
    indexerVersion: '0.1.0',
    sourceRevision: id,
    sourceBranch: 'main',
    importedAt,
    scopeCount: 1,
    entityCount: 1,
    relationshipCount: 0,
    diagnosticCount: 0,
    indexedFileCount: 1,
    totalFileCount: 1,
    degradedFileCount: 0,
  };
}

function createController() {
  let captured: ReturnType<typeof useBrowserViewScreenController> | null = null;
  function Probe() {
    captured = useBrowserViewScreenController({} as never);
    return createElement('div');
  }
  renderToStaticMarkup(createElement(Probe));
  if (!captured) {
    throw new Error('Expected controller to be captured during render.');
  }
  return captured as ReturnType<typeof useBrowserViewScreenController>;
}

beforeEach(() => {
  const sessionState = createEmptyBrowserSessionState();
  mockSelection = {
    selectedWorkspaceId: 'ws-1',
    selectedRepositoryId: 'repo-1',
    selectedSnapshotId: null,
    setSelectedWorkspaceId: jest.fn(),
    setSelectedRepositoryId: jest.fn(),
    setSelectedSnapshotId: jest.fn(),
  };
  mockBrowserSession = {
    state: sessionState,
    lifecycle: {
      openSnapshotSession: jest.fn(),
      replaceState: jest.fn(),
    },
    navigation: {
      selectScope: jest.fn(),
      setSearch: jest.fn(),
      setTreeMode: jest.fn(),
    },
    viewpoint: {
      setSelectedViewpoint: jest.fn(),
      setScopeMode: jest.fn(),
      setApplyMode: jest.fn(),
      setVariant: jest.fn(),
      setPresentationPreference: jest.fn(),
      applySelectedViewpoint: jest.fn(),
    },
    canvas: {
      addScopeToCanvas: jest.fn(),
      addEntityToCanvas: jest.fn(),
      addEntitiesToCanvas: jest.fn(),
      addPrimaryEntitiesForScope: jest.fn(),
      selectEntity: jest.fn(),
      addDependenciesToCanvas: jest.fn(),
      removeEntityFromCanvas: jest.fn(),
      isolateSelection: jest.fn(),
      removeSelection: jest.fn(),
      toggleNodePin: jest.fn(),
      moveNode: jest.fn(),
      setViewport: jest.fn(),
      panViewport: jest.fn(),
      arrangeAllNodes: jest.fn(),
      arrangeWithMode: jest.fn(),
      arrangeAroundFocus: jest.fn(),
      relayout: jest.fn(),
      clear: jest.fn(),
      fitView: jest.fn(),
    },
    factsPanel: {
      focusElement: jest.fn(),
      open: jest.fn(),
    },
  };
  mockBrowserLayout = {
    activeTab: 'overview',
    setActiveTab: jest.fn(),
    topSearchScopeMode: 'selected-scope',
  };
  mockWorkspaceData = {
    workspacesLoaded: true,
    workspaces: [{ id: 'ws-1', name: 'Workspace', status: 'ACTIVE' }],
    workspaceDetailLoadedFor: 'ws-1',
    selectedWorkspaceId: 'ws-1',
    selectedWorkspace: { id: 'ws-1', name: 'Workspace', status: 'ACTIVE' },
    repositories: [{ id: 'repo-1', workspaceId: 'ws-1', name: 'Platform', repositoryKey: 'platform', sourceType: 'LOCAL_PATH', localPath: '/tmp/platform', remoteUrl: null, defaultBranch: 'main', status: 'ACTIVE' }],
    snapshots: [],
    loadWorkspaceDetail: jest.fn(async () => ({ snapshotPayload: [] })),
    loadWorkspaces: jest.fn(async () => undefined),
    handleRequestRun: jest.fn(async () => null),
    handleArchiveRepository: jest.fn(async () => undefined),
  };
  mockBootstrap = { status: 'idle', message: null, isReady: false };
  mockSavedCanvasController = {
    isSavedCanvasDialogOpen: false,
    setIsSavedCanvasDialogOpen: jest.fn(),
  };
  mockBrowserActions = { focusCanvas: jest.fn() };
  mockSnapshotCache = {
    getSnapshot: jest.fn(async () => null),
    isSnapshotCurrent: jest.fn(() => false),
  };
});

describe('BrowserView screen controller safety net', () => {
  test('keeps the startup gate visible while source trees are still loading', () => {
    mockWorkspaceData.workspacesLoaded = false;

    const controller = createController();

    expect(controller.startup.shouldShowGate).toBe(true);
    expect(controller.startup.gateMessage).toBe('Loading source trees…');
  });

  test('keeps the startup gate visible while a selected prepared snapshot is bootstrapping', () => {
    const snapshot = buildSnapshot('snap-loading', '2026-03-24T00:00:00Z');
    mockSelection.selectedSnapshotId = snapshot.id;
    mockWorkspaceData.snapshots = [snapshot];
    mockBootstrap = {
      status: 'loading',
      message: 'Preparing Browser snapshot…',
      isReady: false,
    };

    const controller = createController();

    expect(controller.selectedSnapshot?.id).toBe(snapshot.id);
    expect(controller.startup.shouldShowGate).toBe(true);
    expect(controller.startup.gateMessage).toBe('Preparing Browser snapshot…');
  });

  test('prefers the newest locally prepared snapshot when selecting a source tree', async () => {
    const staleSnapshot = buildSnapshot('snap-newest-stale', '2026-03-25T00:00:00Z');
    const preparedSnapshot = buildSnapshot('snap-prepared', '2026-03-22T00:00:00Z');
    mockWorkspaceData.snapshots = [staleSnapshot, preparedSnapshot];
    mockSnapshotCache.getSnapshot = jest.fn(async (snapshotId: string) => snapshotId === preparedSnapshot.id
      ? { payload: { snapshot: preparedSnapshot }, cachedAt: '2026-03-26T00:00:00Z' }
      : null);
    mockSnapshotCache.isSnapshotCurrent = jest.fn((snapshot: SnapshotSummary, record: { payload?: { snapshot?: SnapshotSummary } } | null) => (
      Boolean(record) && record?.payload?.snapshot?.id === snapshot.id
    ));

    const controller = createController();
    const sourceTreeItem: SourceTreeLauncherItem = controller.sourceTreeLauncherItems[0]!;

    await controller.handlers.handleSelectSourceTree(sourceTreeItem);

    expect(mockSelection.setSelectedWorkspaceId).toHaveBeenCalledWith('ws-1');
    expect(mockSelection.setSelectedRepositoryId).toHaveBeenCalledWith('repo-1');
    expect(mockSelection.setSelectedSnapshotId).toHaveBeenCalledWith('snap-prepared');
    expect(mockWorkspaceData.loadWorkspaceDetail).not.toHaveBeenCalled();
  });

  test('loads the target workspace detail and falls back to the latest snapshot when no prepared snapshot is current', async () => {
    const latestSnapshot = {
      ...buildSnapshot('snap-remote-latest', '2026-03-28T00:00:00Z'),
      workspaceId: 'ws-2',
      repositoryRegistrationId: 'repo-2',
    };
    mockSelection.selectedWorkspaceId = 'ws-1';
    mockWorkspaceData.selectedWorkspaceId = 'ws-1';
    mockWorkspaceData.workspaces = [
      { id: 'ws-1', name: 'Workspace 1', status: 'ACTIVE' },
      { id: 'ws-2', name: 'Workspace 2', status: 'ACTIVE' },
    ];
    mockWorkspaceData.loadWorkspaceDetail = jest.fn(async (workspaceId: string) => ({
      snapshotPayload: workspaceId === 'ws-2' ? [latestSnapshot] : [],
    }));

    const controller = createController();

    await controller.handlers.handleSelectSourceTree({
      id: 'ws-2::repo-2',
      workspaceId: 'ws-2',
      workspaceName: 'Workspace 2',
      repositoryId: 'repo-2',
      sourceTreeLabel: 'Indexer',
      sourceTreeKey: 'indexer',
      sourceSummary: 'git@example/indexer',
      indexedVersionLabel: latestSnapshot.snapshotKey,
      latestSnapshotId: latestSnapshot.id,
      latestSnapshotKey: latestSnapshot.snapshotKey,
      latestImportedAt: latestSnapshot.importedAt,
      status: 'ready',
      latestRunStatusLabel: 'Success',
      latestIndexedAtLabel: latestSnapshot.importedAt,
      searchText: 'indexer',
    });

    expect(mockWorkspaceData.loadWorkspaceDetail).toHaveBeenCalledWith('ws-2');
    expect(mockSelection.setSelectedWorkspaceId).toHaveBeenCalledWith('ws-2');
    expect(mockSelection.setSelectedRepositoryId).toHaveBeenCalledWith('repo-2');
    expect(mockSelection.setSelectedSnapshotId).toHaveBeenCalledWith('snap-remote-latest');
  });
});
