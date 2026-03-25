import { createSavedCanvasDocument } from '../saved-canvas/model/document';
import { buildAcceptedSavedCanvasRebindingDocument } from '../saved-canvas/rebinding/accepted';

describe('savedCanvasAcceptedRebinding', () => {
  it('preserves original provenance while persisting accepted rebinding metadata', () => {
    const baseline = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Search canvas',
      originSnapshot: {
        snapshotId: 'snapshot-a',
        snapshotKey: 'repo@snapshot-a',
        workspaceId: 'workspace-1',
        repositoryRegistrationId: 'repo-1',
        repositoryKey: 'repo-key',
        repositoryName: 'Repo',
        sourceBranch: 'main',
        sourceRevision: 'abc123',
        importedAt: '2026-03-24T12:00:00Z',
      },
      syncState: 'SYNCHRONIZED',
      localVersion: 2,
      backendVersion: '4',
      createdAt: '2026-03-24T12:00:00Z',
      updatedAt: '2026-03-24T12:10:00Z',
      lastModifiedAt: '2026-03-24T12:10:00Z',
      lastSyncedAt: '2026-03-24T12:11:00Z',
    });
    const rebound = {
      ...baseline,
      bindings: {
        ...baseline.bindings,
        currentTargetSnapshot: {
          ...baseline.bindings.originSnapshot,
          snapshotId: 'snapshot-b',
          snapshotKey: 'repo@snapshot-b',
        },
        rebinding: {
          sourceSnapshotId: 'snapshot-a',
          targetSnapshotId: 'snapshot-b',
          rebindingState: 'PARTIAL' as const,
          exactMatchCount: 3,
          remappedCount: 0,
          unresolvedCount: 1,
          reviewedAt: '2026-03-24T12:20:00Z',
        },
      },
    };

    const accepted = buildAcceptedSavedCanvasRebindingDocument({
      baseline,
      rebound,
      acceptedAt: '2026-03-24T12:21:00Z',
    });

    expect(accepted.bindings.originSnapshot.snapshotId).toBe('snapshot-a');
    expect(accepted.bindings.currentTargetSnapshot?.snapshotId).toBe('snapshot-b');
    expect(accepted.bindings.rebinding?.targetSnapshotId).toBe('snapshot-b');
    expect(accepted.sync.localVersion).toBe(3);
    expect(accepted.sync.state).toBe('LOCALLY_MODIFIED');
    expect(accepted.metadata.createdAt).toBe('2026-03-24T12:00:00Z');
    expect(accepted.metadata.updatedAt).toBe('2026-03-24T12:21:00Z');
  });

  it('keeps local-only state local when accepting rebinding before first backend sync', () => {
    const baseline = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Search canvas',
      originSnapshot: {
        snapshotId: 'snapshot-a',
        snapshotKey: 'repo@snapshot-a',
        workspaceId: 'workspace-1',
        repositoryRegistrationId: 'repo-1',
        repositoryKey: 'repo-key',
        repositoryName: 'Repo',
        sourceBranch: 'main',
        sourceRevision: 'abc123',
        importedAt: '2026-03-24T12:00:00Z',
      },
      syncState: 'LOCAL_ONLY',
      localVersion: 1,
      createdAt: '2026-03-24T12:00:00Z',
      updatedAt: '2026-03-24T12:00:00Z',
      lastModifiedAt: '2026-03-24T12:00:00Z',
    });
    const rebound = {
      ...baseline,
      bindings: {
        ...baseline.bindings,
        currentTargetSnapshot: {
          ...baseline.bindings.originSnapshot,
          snapshotId: 'snapshot-b',
          snapshotKey: 'repo@snapshot-b',
        },
        rebinding: {
          sourceSnapshotId: 'snapshot-a',
          targetSnapshotId: 'snapshot-b',
          rebindingState: 'EXACT' as const,
          exactMatchCount: 4,
          remappedCount: 0,
          unresolvedCount: 0,
          reviewedAt: null,
        },
      },
    };

    const accepted = buildAcceptedSavedCanvasRebindingDocument({
      baseline,
      rebound,
      acceptedAt: '2026-03-24T12:05:00Z',
    });

    expect(accepted.sync.state).toBe('LOCAL_ONLY');
    expect(accepted.bindings.rebinding?.reviewedAt).toBe('2026-03-24T12:05:00Z');
  });
});
