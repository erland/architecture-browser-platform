import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import {
  applyPreparedSnapshotBootstrapFailure,
  applyPreparedSnapshotToBrowserSession,
  resetBrowserSessionForBootstrap,
} from '../../hooks/useBrowserSessionBootstrap.application';
import { createEmptyBrowserSessionState } from '../../browser-session/state';
import { openSnapshotSession } from '../../browser-session/lifecycle-api';
import { setBrowserSearch } from '../../browser-session/navigation-api';
import type { BrowserSessionState } from '../../browser-session/types';

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
    ],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser session bootstrap application helpers', () => {
  test('resets browser session state through the dedicated bootstrap reset helper', () => {
    let currentState: BrowserSessionState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    resetBrowserSessionForBootstrap((nextState) => {
      currentState = nextState;
    });

    expect(currentState.activeSnapshot).toBeNull();
    expect(currentState.index).toBeNull();
    expect(currentState.payload).toBeNull();
  });

  test('applies a prepared snapshot to the browser session while preserving view state for the same snapshot', () => {
    const record = {
      snapshotId: snapshotSummary.id,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: 'cache-v1',
      cachedAt: '2026-03-13T12:00:00Z',
      lastAccessedAt: '2026-03-13T12:00:00Z',
      payload: createPayload(),
    };

    let currentState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    currentState = setBrowserSearch(currentState, 'browser', 'scope:web');

    const outcome = applyPreparedSnapshotToBrowserSession({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState,
      record,
      openSnapshotSession: (options) => {
        currentState = openSnapshotSession(currentState, options);
      },
    });

    expect(outcome).toEqual({
      status: 'ready',
      message: 'Browser session ready for snapshot platform-main-bootstrap.',
      opened: true,
    });
    expect(currentState.searchQuery).toBe('browser');
    expect(currentState.searchScopeId).toBe('scope:web');
    expect(currentState.activeSnapshot?.preparedAt).toBe('2026-03-13T12:00:00Z');
  });

  test('applies prepared-snapshot bootstrap failure and clears stale state when requested', () => {
    const clearSnapshotSession = jest.fn();

    const outcome = applyPreparedSnapshotBootstrapFailure({
      snapshot: snapshotSummary,
      message: 'Failed to prepare snapshot platform-main-bootstrap for Browser use. fetch disabled',
      shouldClearStaleSession: true,
      clearSnapshotSession,
    });

    expect(outcome).toEqual({
      status: 'failed',
      message: 'Failed to prepare snapshot platform-main-bootstrap for Browser use. fetch disabled',
      opened: false,
    });
    expect(clearSnapshotSession).toHaveBeenCalledTimes(1);
  });
});
