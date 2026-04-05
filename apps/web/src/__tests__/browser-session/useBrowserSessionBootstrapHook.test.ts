let mockStateCursor = 0;
let mockRefCursor = 0;
const mockStateSlots: Array<{ value: unknown; setCalls: unknown[] }> = [];
const mockRefSlots: Array<{ current: unknown }> = [];
let mockEffectCallbacks: Array<() => void | (() => void)> = [];

const mockUseBrowserSession = jest.fn();
const mockGetBrowserPreparedSnapshotCache = jest.fn();
const mockLoadPreparedSnapshotRecordForSummary = jest.fn();
const mockGetFullSnapshotPayload = jest.fn();

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useState: jest.fn((initial: unknown) => {
      const index = mockStateCursor++;
      if (!mockStateSlots[index]) {
        mockStateSlots[index] = {
          value: typeof initial === 'function' ? (initial as () => unknown)() : initial,
          setCalls: [],
        };
      }
      const setState = (next: unknown) => {
        const resolved = typeof next === 'function'
          ? (next as (previous: unknown) => unknown)(mockStateSlots[index].value)
          : next;
        mockStateSlots[index].value = resolved;
        mockStateSlots[index].setCalls.push(resolved);
      };
      return [mockStateSlots[index].value, setState];
    }),
    useRef: jest.fn((initial: unknown) => {
      const index = mockRefCursor++;
      if (!mockRefSlots[index]) {
        mockRefSlots[index] = { current: initial };
      }
      return mockRefSlots[index];
    }),
    useEffect: jest.fn((callback: () => void | (() => void)) => {
      mockEffectCallbacks.push(callback);
    }),
  };
});

jest.mock('../../contexts/BrowserSessionContext', () => ({
  useBrowserSession: () => mockUseBrowserSession(),
}));

jest.mock('../../browser-snapshot', () => {
  const actual = jest.requireActual('../../browser-snapshot');
  return {
    ...actual,
    getBrowserPreparedSnapshotCache: () => mockGetBrowserPreparedSnapshotCache(),
    loadPreparedSnapshotRecordForSummary: (...args: unknown[]) => mockLoadPreparedSnapshotRecordForSummary(...args),
  };
});

jest.mock('../../api/platformApi', () => ({
  platformApi: {
    getFullSnapshotPayload: (...args: unknown[]) => mockGetFullSnapshotPayload(...args),
  },
}));

import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';
import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { createEmptyBrowserSessionState, openSnapshotSession, type BrowserSessionState } from '../../browser-session';
import { useBrowserSessionBootstrap } from '../../hooks/useBrowserSessionBootstrap';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-bootstrap-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-bootstrap',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 2,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: { ...snapshotSummary },
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

function resetHookHarness() {
  mockStateCursor = 0;
  mockRefCursor = 0;
  mockEffectCallbacks = [];
}

function resetStoredHookState() {
  mockStateSlots.length = 0;
  mockRefSlots.length = 0;
  resetHookHarness();
}

async function runRegisteredEffects() {
  const callbacks = [...mockEffectCallbacks];
  mockEffectCallbacks = [];
  for (const callback of callbacks) {
    callback();
  }
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve();
  }
}

function latestStatus() {
  return mockStateSlots[0]?.value as string | undefined;
}

function latestMessage() {
  return mockStateSlots[1]?.value as string | null | undefined;
}

function createBrowserSessionValue(state: BrowserSessionState, overrides?: {
  openSnapshotSession?: (options: Parameters<BrowserSessionContextValue['lifecycle']['openSnapshotSession']>[0]) => void;
  replaceState?: (nextState: BrowserSessionState) => void;
}): BrowserSessionContextValue {
  return {
    state,
    lifecycle: {
      openSnapshotSession: overrides?.openSnapshotSession ?? jest.fn(),
      replaceState: overrides?.replaceState ?? jest.fn(),
    },
    navigation: {
      selectScope: jest.fn(),
      setSearch: jest.fn(),
      setTreeMode: jest.fn(),
      setNavigationTreeState: jest.fn(),
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
      clearSelection: jest.fn(),
      selectAllEntities: jest.fn(),
      toggleNodePin: jest.fn(),
      setClassPresentationMode: jest.fn(),
      toggleClassPresentationMembers: jest.fn(),
      moveNode: jest.fn(),
      reconcileNodePositions: jest.fn(),
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
}

describe('useBrowserSessionBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStoredHookState();
    mockGetBrowserPreparedSnapshotCache.mockReturnValue({});
    mockLoadPreparedSnapshotRecordForSummary.mockResolvedValue(null);
    mockGetFullSnapshotPayload.mockRejectedValue(new Error('fetch disabled'));
    delete (globalThis as { navigator?: { onLine: boolean } }).navigator;
  });

  test('clears a stale browser session and returns idle when no workspace or snapshot is selected', async () => {
    let currentState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-old',
      repositoryId: 'repo-old',
      payload: {
        ...createPayload(),
        snapshot: {
          ...createPayload().snapshot,
          id: 'snap-old',
          workspaceId: 'ws-old',
          repositoryRegistrationId: 'repo-old',
          snapshotKey: 'old-snapshot',
        },
        source: {
          ...createPayload().source,
          repositoryId: 'repo-old',
        },
      },
    });

    const replaceState = jest.fn((nextState: BrowserSessionState) => {
      currentState = nextState;
    });

    mockUseBrowserSession.mockImplementation(() => createBrowserSessionValue(currentState, { replaceState }));

    resetHookHarness();
    const result = useBrowserSessionBootstrap({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: null,
    });

    await runRegisteredEffects();

    expect(result.status).toBe('idle');
    expect(result.message).toBeNull();
    expect(result.isReady).toBe(false);
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(currentState.activeSnapshot).toBeNull();
    expect(currentState.index).toBeNull();
    expect(currentState.payload).toBeNull();
    expect(latestStatus()).toBe('idle');
    expect(latestMessage()).toBeNull();
  });

  test('opens a prepared snapshot, then short-circuits to ready on the next render for the same prepared target', async () => {
    let currentState = createEmptyBrowserSessionState();
    const preparedRecord = {
      snapshotId: snapshotSummary.id,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: 'cache-v1',
      cachedAt: '2026-03-13T12:00:00Z',
      lastAccessedAt: '2026-03-13T12:00:00Z',
      payload: createPayload(),
    };
    mockLoadPreparedSnapshotRecordForSummary.mockResolvedValue(preparedRecord);

    const openSnapshotSessionSpy = jest.fn((options: Parameters<BrowserSessionContextValue['lifecycle']['openSnapshotSession']>[0]) => {
      currentState = openSnapshotSession(currentState, options);
    });

    mockUseBrowserSession.mockImplementation(() => createBrowserSessionValue(currentState, { openSnapshotSession: openSnapshotSessionSpy }));

    resetHookHarness();
    const firstRender = useBrowserSessionBootstrap({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
    });

    await runRegisteredEffects();

    expect(firstRender.status).toBe('idle');
    expect(openSnapshotSessionSpy).toHaveBeenCalledTimes(1);
    expect(mockStateSlots[0].setCalls).toEqual(['loading', 'ready']);
    expect(mockStateSlots[1].setCalls).toEqual([
      'Loading prepared Browser session for snapshot platform-main-bootstrap…',
      'Browser session ready for snapshot platform-main-bootstrap.',
    ]);
    expect(currentState.activeSnapshot?.snapshotId).toBe(snapshotSummary.id);
    expect(currentState.index?.snapshotId).toBe(snapshotSummary.id);
    expect(currentState.payload?.snapshot.id).toBe(snapshotSummary.id);

    resetHookHarness();
    const secondRender = useBrowserSessionBootstrap({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
    });

    await runRegisteredEffects();

    expect(secondRender.status).toBe('ready');
    expect(secondRender.message).toBe('Browser session ready for snapshot platform-main-bootstrap.');
    expect(secondRender.isReady).toBe(true);
    expect(openSnapshotSessionSpy).toHaveBeenCalledTimes(1);
  });

  test('reports a failed bootstrap when the selected snapshot cannot be prepared', async () => {
    let currentState = createEmptyBrowserSessionState();
    mockLoadPreparedSnapshotRecordForSummary.mockResolvedValue(null);
    mockGetFullSnapshotPayload.mockRejectedValue(new Error('fetch disabled'));

    const openSnapshotSessionSpy = jest.fn((options: Parameters<BrowserSessionContextValue['lifecycle']['openSnapshotSession']>[0]) => {
      currentState = openSnapshotSession(currentState, options);
    });

    mockUseBrowserSession.mockImplementation(() => createBrowserSessionValue(currentState, { openSnapshotSession: openSnapshotSessionSpy }));

    resetHookHarness();
    const result = useBrowserSessionBootstrap({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
    });

    await runRegisteredEffects();

    expect(result.status).toBe('idle');
    expect(openSnapshotSessionSpy).not.toHaveBeenCalled();
    expect(latestStatus()).toBe('failed');
    expect(latestMessage()).toBe('Failed to prepare snapshot platform-main-bootstrap for Browser use. fetch disabled');
    expect(currentState.activeSnapshot).toBeNull();
    expect(currentState.index).toBeNull();
    expect(currentState.payload).toBeNull();
  });
});
