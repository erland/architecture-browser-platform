import {
  deriveBrowserSessionBootstrapImmediateState,
  executeBrowserSessionBootstrapPlan,
  resolveBrowserSessionBootstrapCompletedKey,
} from '../../hooks/useBrowserSessionBootstrap.execution';
import type { BrowserSessionBootstrapPlan } from '../../hooks/useBrowserSessionBootstrap.planner';
import type { SnapshotSummary } from '../../app-model';
import { createSnapshotCache, InMemorySnapshotCacheStorage } from '../../api/snapshotCache';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browser-session';

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

function createPayload() {
  return {
    snapshot: { ...snapshotSummary },
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT' as const, path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS' as const, detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE' as const, indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [],
    entities: [],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser session bootstrap execution', () => {
  test('derives immediate idle state including stale-session clearing intent', () => {
    const plan: BrowserSessionBootstrapPlan = {
      kind: 'idle',
      status: 'idle',
      message: null,
      bootstrapTargetKey: null,
      shouldClearStaleSession: true,
    };

    expect(deriveBrowserSessionBootstrapImmediateState(plan)).toEqual({
      status: 'idle',
      message: null,
      shouldClearStaleSession: true,
      shouldStop: true,
      completedBootstrapKey: null,
    });
  });

  test('derives immediate already-ready state and preserves the completed bootstrap key', () => {
    const plan: BrowserSessionBootstrapPlan = {
      kind: 'already-ready',
      status: 'ready',
      message: 'Browser session ready for snapshot platform-main-bootstrap.',
      bootstrapTargetKey: 'ws-1:snap-bootstrap-1',
      shouldClearStaleSession: false,
    };

    expect(deriveBrowserSessionBootstrapImmediateState(plan)).toEqual({
      status: 'ready',
      message: 'Browser session ready for snapshot platform-main-bootstrap.',
      shouldClearStaleSession: false,
      shouldStop: true,
      completedBootstrapKey: 'ws-1:snap-bootstrap-1',
    });
  });

  test('does not execute bootstrap work for non-bootstrap plans', async () => {
    const plan: BrowserSessionBootstrapPlan = {
      kind: 'idle',
      status: 'idle',
      message: null,
      bootstrapTargetKey: null,
      shouldClearStaleSession: false,
    };

    await expect(executeBrowserSessionBootstrapPlan({
      plan,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: createEmptyBrowserSessionState(),
      openSnapshotSession: jest.fn(),
      clearSnapshotSession: jest.fn(),
    })).resolves.toBeNull();
  });

  test('executes prepared-snapshot bootstrap work for bootstrap plans', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    let currentState = createEmptyBrowserSessionState();
    const outcome = await executeBrowserSessionBootstrapPlan({
      plan: {
        kind: 'bootstrap-prepared-snapshot',
        status: 'loading',
        message: 'Loading prepared Browser session for snapshot platform-main-bootstrap…',
        bootstrapTargetKey: 'ws-1:snap-bootstrap-1',
        shouldClearStaleSession: false,
      },
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState,
      openSnapshotSession: (options) => {
        currentState = openSnapshotSession(currentState, options);
      },
      clearSnapshotSession: jest.fn(),
      cache,
    });

    expect(outcome).toEqual({
      status: 'ready',
      message: 'Browser session ready for snapshot platform-main-bootstrap.',
      opened: true,
    });
    expect(currentState.activeSnapshot?.snapshotId).toBe(snapshotSummary.id);
  });

  test('resolves the completed bootstrap key only for successful bootstrap execution', () => {
    const plan: BrowserSessionBootstrapPlan = {
      kind: 'bootstrap-prepared-snapshot',
      status: 'loading',
      message: 'Loading prepared Browser session for snapshot platform-main-bootstrap…',
      bootstrapTargetKey: 'ws-1:snap-bootstrap-1',
      shouldClearStaleSession: false,
    };

    expect(resolveBrowserSessionBootstrapCompletedKey({
      plan,
      outcome: {
        status: 'ready',
        message: 'Browser session ready for snapshot platform-main-bootstrap.',
        opened: true,
      },
      previousCompletedBootstrapKey: null,
    })).toBe('ws-1:snap-bootstrap-1');

    expect(resolveBrowserSessionBootstrapCompletedKey({
      plan,
      outcome: {
        status: 'failed',
        message: 'boom',
        opened: false,
      },
      previousCompletedBootstrapKey: 'previous',
    })).toBe('previous');
  });
});
