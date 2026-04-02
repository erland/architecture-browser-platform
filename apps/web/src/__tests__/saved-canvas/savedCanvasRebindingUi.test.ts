import { buildSavedCanvasRebindingStatusMessage, toSavedCanvasRebindingUiSummary } from '../../saved-canvas/rebinding';
import { createSavedCanvasDocument, type SavedCanvasDocument } from '../../saved-canvas';
import type { SavedCanvasRebindResult } from '../../saved-canvas/rebinding';

function createDocument(): SavedCanvasDocument {
  return createSavedCanvasDocument({
    canvasId: 'canvas-1',
    name: 'Dependency focus',
    originSnapshot: {
      snapshotId: 'snapshot-a',
      snapshotKey: 'repo@snapshot-a',
      workspaceId: 'workspace-1',
      repositoryRegistrationId: 'repo-1',
      repositoryKey: 'repo',
      repositoryName: 'Repo',
      sourceBranch: 'main',
      sourceRevision: 'abc123',
      importedAt: '2026-03-24T10:00:00Z',
    },
    rebinding: {
      sourceSnapshotId: 'snapshot-a',
      targetSnapshotId: 'snapshot-b',
      rebindingState: 'PARTIAL',
      exactMatchCount: 3,
      remappedCount: 1,
      unresolvedCount: 2,
      reviewedAt: '2026-03-24T11:00:00Z',
    },
  });
}

describe('savedCanvasRebindingUi', () => {
  it('exposes unresolved items for UI display', () => {
    const document = createDocument();
    const result: SavedCanvasRebindResult = {
      document,
      exactMatchCount: 3,
      remappedCount: 1,
      unresolvedCount: 2,
      unresolvedNodeIds: ['entity:search'],
      unresolvedEdgeIds: ['rel:browser-search'],
    };

    expect(toSavedCanvasRebindingUiSummary(result)).toEqual({
      rebindingState: 'PARTIAL',
      exactMatchCount: 3,
      remappedCount: 1,
      unresolvedCount: 2,
      unresolvedNodeIds: ['entity:search'],
      unresolvedEdgeIds: ['rel:browser-search'],
    });
  });

  it('mentions review guidance when unresolved items remain', () => {
    const message = buildSavedCanvasRebindingStatusMessage({
      canvasName: 'Dependency focus',
      targetSnapshotLabel: 'repo@snapshot-b',
      summary: {
        rebindingState: 'PARTIAL',
        exactMatchCount: 3,
        remappedCount: 1,
        unresolvedCount: 2,
        unresolvedNodeIds: ['entity:search'],
        unresolvedEdgeIds: ['rel:browser-search'],
      },
    });

    expect(message).toContain('Dependency focus');
    expect(message).toContain('1 fallback remap(s)');
    expect(message).toContain('2 unresolved item(s)');
    expect(message).toContain('Review the unresolved items in the Canvases dialog');
  });
});
