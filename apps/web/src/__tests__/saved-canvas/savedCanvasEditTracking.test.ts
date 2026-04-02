import { createSavedCanvasDocumentFromBrowserSession } from '../../saved-canvas';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browser-session';
import type { BrowserSessionState } from '../../browser-session';
import type { FullSnapshotPayload } from '../../app-model';
import {
  buildSavedCanvasTrackedDocument,
  hasSavedCanvasTrackedContentEdits,
  hasSavedCanvasTrackedNameEdit,
} from '../../saved-canvas';

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: {
      id: 'snapshot-a',
      workspaceId: 'workspace-1',
      repositoryRegistrationId: 'repo-1',
      repositoryKey: 'repo-key',
      repositoryName: 'Repo',
      runId: null,
      snapshotKey: 'repo@snapshot-a',
      status: 'READY',
      completenessStatus: 'COMPLETE',
      derivedRunOutcome: 'SUCCESS',
      schemaVersion: '1',
      indexerVersion: '1',
      sourceRevision: 'abc123',
      sourceBranch: 'main',
      importedAt: '2026-03-24T12:00:00Z',
      scopeCount: 1,
      entityCount: 1,
      relationshipCount: 0,
      diagnosticCount: 0,
      indexedFileCount: 1,
      totalFileCount: 1,
      degradedFileCount: 0,
    },
    source: {
      repositoryId: 'repo-1',
      acquisitionType: null,
      path: null,
      remoteUrl: null,
      branch: 'main',
      revision: 'abc123',
      acquiredAt: '2026-03-24T12:00:00Z',
    },
    run: {
      startedAt: '2026-03-24T11:59:00Z',
      completedAt: '2026-03-24T12:00:00Z',
      outcome: 'SUCCESS',
      detectedTechnologies: ['typescript'],
    },
    completeness: {
      status: 'COMPLETE',
      indexedFileCount: 1,
      totalFileCount: 1,
      degradedFileCount: 0,
      omittedPaths: [],
      notes: [],
    },
    scopes: [
      {
        externalId: 'scope:root',
        parentScopeId: null,
        name: 'root',
        displayName: 'root',
        kind: 'DIRECTORY',
        sourceRefs: [],
        metadata: { path: 'root' },
      },
    ],
    entities: [
      {
        externalId: 'entity:search',
        scopeId: 'scope:root',
        name: 'SearchService',
        displayName: 'SearchService',
        kind: 'SERVICE',
        origin: null,
        sourceRefs: [
          {
            path: 'src/SearchService.ts',
            startLine: 1,
            endLine: 10,
            snippet: null,
            metadata: {},
          },
        ],
        metadata: {
          language: 'ts',
          signature: 'SearchService',
        },
      },
    ],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: {
      metadata: {},
    },
    warnings: [],
  };
}

describe('savedCanvasEditTracking', () => {
  it('does not report edits for an unchanged opened saved canvas', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'workspace-1',
      repositoryId: 'repo-1',
      payload,
      preparedAt: '2026-03-24T12:00:00Z',
    });
    state = {
      ...state,
      canvasNodes: [{ kind: 'entity', id: 'entity:search', x: 100, y: 200, pinned: false, manuallyPlaced: true }],
    };
    const baseline = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-1',
      name: 'Search canvas',
      syncState: 'SYNCHRONIZED',
      localVersion: 2,
      backendVersion: '4',
      createdAt: '2026-03-24T12:00:00Z',
      updatedAt: '2026-03-24T12:00:00Z',
      lastModifiedAt: '2026-03-24T12:00:00Z',
      lastSyncedAt: '2026-03-24T12:01:00Z',
    });

    expect(hasSavedCanvasTrackedContentEdits({ state, baseline })).toBe(false);
    expect(hasSavedCanvasTrackedNameEdit('Search canvas', baseline)).toBe(false);
  });

  it('reports edits when a canvas node moves after opening a saved canvas', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'workspace-1',
      repositoryId: 'repo-1',
      payload,
      preparedAt: '2026-03-24T12:00:00Z',
    });
    state = {
      ...state,
      canvasNodes: [{ kind: 'entity', id: 'entity:search', x: 100, y: 200, pinned: false, manuallyPlaced: true }],
    };
    const baseline = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-1',
      name: 'Search canvas',
      syncState: 'SYNCHRONIZED',
      localVersion: 2,
      backendVersion: '4',
      createdAt: '2026-03-24T12:00:00Z',
      updatedAt: '2026-03-24T12:00:00Z',
      lastModifiedAt: '2026-03-24T12:00:00Z',
      lastSyncedAt: '2026-03-24T12:01:00Z',
    });

    const editedState: BrowserSessionState = {
      ...state,
      canvasNodes: [{ kind: 'entity', id: 'entity:search', x: 160, y: 240, pinned: false, manuallyPlaced: true }],
    };

    expect(hasSavedCanvasTrackedContentEdits({ state: editedState, baseline })).toBe(true);
  });

  it('preserves saved canvas provenance when building tracked documents from the live session', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'workspace-1',
      repositoryId: 'repo-1',
      payload,
      preparedAt: '2026-03-24T12:00:00Z',
    });
    state = {
      ...state,
      canvasNodes: [{ kind: 'entity', id: 'entity:search', x: 100, y: 200, pinned: false, manuallyPlaced: true }],
    };
    const baseline = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-1',
      name: 'Search canvas',
      syncState: 'SYNCHRONIZED',
      localVersion: 2,
      backendVersion: '4',
      createdAt: '2026-03-24T12:00:00Z',
      updatedAt: '2026-03-24T12:00:00Z',
      lastModifiedAt: '2026-03-24T12:00:00Z',
      lastSyncedAt: '2026-03-24T12:01:00Z',
    });
    const rebasedBaseline = {
      ...baseline,
      bindings: {
        ...baseline.bindings,
        originSnapshot: {
          ...baseline.bindings.originSnapshot,
          snapshotId: 'snapshot-origin',
        },
        currentTargetSnapshot: {
          ...baseline.bindings.originSnapshot,
          snapshotId: 'snapshot-target',
        },
      },
    };

    const tracked = buildSavedCanvasTrackedDocument({ state, baseline: rebasedBaseline });

    expect(tracked.bindings.originSnapshot.snapshotId).toBe('snapshot-origin');
    expect(tracked.bindings.currentTargetSnapshot?.snapshotId).toBe('snapshot-target');
    expect(tracked.sync.backendVersion).toBe('4');
  });
});
