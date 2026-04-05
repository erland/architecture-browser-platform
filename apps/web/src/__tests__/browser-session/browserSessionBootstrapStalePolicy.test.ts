import type { SnapshotSummary } from '../../app-model';
import { shouldClearStaleBrowserSession } from '../../hooks/useBrowserSessionBootstrap.stalePolicy';

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

describe('browser session bootstrap stale policy', () => {
  test('does not clear when there is no active snapshot', () => {
    expect(shouldClearStaleBrowserSession({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: { activeSnapshot: null },
    })).toBe(false);
  });

  test('does not clear when there is no selected workspace', () => {
    expect(shouldClearStaleBrowserSession({
      workspaceId: null,
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: {
        activeSnapshot: {
          workspaceId: 'ws-old',
          repositoryId: 'repo-old',
          snapshotId: 'snap-old',
          snapshotKey: 'old-snapshot',
          preparedAt: '2026-03-01T00:00:00Z',
        },
      },
    })).toBe(false);
  });

  test('clears when the selected workspace no longer matches the active snapshot', () => {
    expect(shouldClearStaleBrowserSession({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: {
        activeSnapshot: {
          workspaceId: 'ws-old',
          repositoryId: 'repo-1',
          snapshotId: snapshotSummary.id,
          snapshotKey: snapshotSummary.snapshotKey,
          preparedAt: '2026-03-01T00:00:00Z',
        },
      },
    })).toBe(true);
  });

  test('clears when the repository no longer matches the active snapshot', () => {
    expect(shouldClearStaleBrowserSession({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: {
        activeSnapshot: {
          workspaceId: 'ws-1',
          repositoryId: 'repo-old',
          snapshotId: snapshotSummary.id,
          snapshotKey: snapshotSummary.snapshotKey,
          preparedAt: '2026-03-01T00:00:00Z',
        },
      },
    })).toBe(true);
  });

  test('clears when the selected snapshot no longer matches the active snapshot', () => {
    expect(shouldClearStaleBrowserSession({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: {
        activeSnapshot: {
          workspaceId: 'ws-1',
          repositoryId: 'repo-1',
          snapshotId: 'snap-old',
          snapshotKey: 'old-snapshot',
          preparedAt: '2026-03-01T00:00:00Z',
        },
      },
    })).toBe(true);
  });

  test('does not clear when no snapshot is selected but the repository still matches', () => {
    expect(shouldClearStaleBrowserSession({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: null,
      currentState: {
        activeSnapshot: {
          workspaceId: 'ws-1',
          repositoryId: 'repo-1',
          snapshotId: 'snap-old',
          snapshotKey: 'old-snapshot',
          preparedAt: '2026-03-01T00:00:00Z',
        },
      },
    })).toBe(false);
  });
});
