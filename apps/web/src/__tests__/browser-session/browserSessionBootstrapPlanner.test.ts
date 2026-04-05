import type { SnapshotSummary } from '../../app-model';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browser-session';
import { computeBrowserSessionBootstrapPlan } from '../../hooks/useBrowserSessionBootstrap.planner';

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

describe('browser session bootstrap planner', () => {
  test('returns an idle plan and stale-session clear intent when no snapshot is selected', () => {
    const currentState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-old',
      payload: {
        snapshot: {
          ...snapshotSummary,
          id: 'snap-old',
          workspaceId: 'ws-1',
          repositoryRegistrationId: 'repo-old',
          snapshotKey: 'old-snapshot',
        },
        source: { repositoryId: 'repo-old', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
        run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: [] },
        completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
        scopes: [],
        entities: [],
        relationships: [],
        viewpoints: [],
        diagnostics: [],
        metadata: { metadata: {} },
        warnings: [],
      },
    });

    expect(
      computeBrowserSessionBootstrapPlan({
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        snapshot: null,
        currentState,
        activeSnapshotId: currentState.activeSnapshot?.snapshotId ?? null,
        hasIndex: Boolean(currentState.index),
        hasPayload: Boolean(currentState.payload),
        completedBootstrapKey: null,
      }),
    ).toMatchObject({
      kind: 'idle',
      shouldClearStaleSession: true,
    });
  });

  test('returns an already-ready plan when the same snapshot is already bootstrapped', () => {
    const currentState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        snapshot: { ...snapshotSummary },
        source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
        run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: [] },
        completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
        scopes: [],
        entities: [],
        relationships: [],
        viewpoints: [],
        diagnostics: [],
        metadata: { metadata: {} },
        warnings: [],
      },
    });
    const bootstrapTargetKey = `ws-1:${snapshotSummary.id}`;

    expect(
      computeBrowserSessionBootstrapPlan({
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        snapshot: snapshotSummary,
        currentState,
        activeSnapshotId: currentState.activeSnapshot?.snapshotId ?? null,
        hasIndex: true,
        hasPayload: true,
        completedBootstrapKey: bootstrapTargetKey,
      }),
    ).toMatchObject({
      kind: 'already-ready',
      bootstrapTargetKey,
    });
  });

  test('returns a bootstrap plan when a snapshot still needs to be prepared/opened', () => {
    const currentState = createEmptyBrowserSessionState();

    expect(
      computeBrowserSessionBootstrapPlan({
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        snapshot: snapshotSummary,
        currentState,
        activeSnapshotId: null,
        hasIndex: false,
        hasPayload: false,
        completedBootstrapKey: null,
      }),
    ).toMatchObject({
      kind: 'bootstrap-prepared-snapshot',
      bootstrapTargetKey: `ws-1:${snapshotSummary.id}`,
    });
  });
});
