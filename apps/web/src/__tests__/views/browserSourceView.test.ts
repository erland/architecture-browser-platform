import type { FullSnapshotPayload, SnapshotSummary, SourceViewReadResponse } from '../../app-model';
import {
  createEmptyBrowserSessionState,
  focusBrowserElement,
  openSnapshotSession,
  selectBrowserScope,
} from '../../browser-session';

const readSourceView = jest.fn();

jest.mock('../../api', () => ({
  platformApi: {
    readSourceView: (...args: unknown[]) => readSourceView(...args),
  },
}));

import { buildSelectedObjectSourceViewRequest, requestSelectedObjectSourceView } from '../../views/browser-view/sourceView';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-source-view-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-source-view',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 1,
  entityCount: 1,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

const payload: FullSnapshotPayload = {
  snapshot: snapshotSummary,
  source: {
    repositoryId: 'repo-1',
    acquisitionType: 'GIT',
    path: null,
    remoteUrl: null,
    branch: 'main',
    revision: 'abc123',
    acquiredAt: null,
  },
  run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
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
      externalId: 'scope:file',
      kind: 'FILE',
      name: 'BrowserFactsPanel.tsx',
      displayName: 'src/components/BrowserFactsPanel.tsx',
      parentScopeId: null,
      sourceRefs: [
        {
          path: 'src/components/BrowserFactsPanel.tsx',
          startLine: null,
          endLine: null,
          snippet: null,
          metadata: {},
        },
      ],
      metadata: {},
    },
  ],
  entities: [
    {
      externalId: 'entity:component',
      kind: 'COMPONENT',
      origin: 'react',
      name: 'BrowserFactsPanel',
      displayName: 'BrowserFactsPanel',
      scopeId: 'scope:file',
      sourceRefs: [
        {
          path: 'src/components/BrowserFactsPanel.tsx',
          startLine: 1,
          endLine: 20,
          snippet: null,
          metadata: {},
        },
      ],
      metadata: {},
    },
  ],
  relationships: [
    {
      externalId: 'rel:uses',
      kind: 'USES',
      fromEntityId: 'entity:component',
      toEntityId: 'entity:component',
      label: 'self',
      sourceRefs: [
        {
          path: 'src/components/BrowserFactsPanel.tsx',
          startLine: 10,
          endLine: 10,
          snippet: null,
          metadata: {},
        },
      ],
      metadata: {},
    },
  ],
  viewpoints: [],
  diagnostics: [],
  metadata: { metadata: {} },
  warnings: [],
};

describe('browser source view request helper', () => {
  beforeEach(() => {
    readSourceView.mockReset();
  });

  test('builds an entity selection request from the focused element', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });

    expect(buildSelectedObjectSourceViewRequest(state)).toEqual({
      snapshotId: 'snap-source-view-1',
      selectedObjectType: 'ENTITY',
      selectedObjectId: 'entity:component',
    });
  });

  test('requests source view through the platform API for the selected object', async () => {
    const response: SourceViewReadResponse = {
      sourceHandle: 'src-handle-1',
      path: 'src/components/BrowserFactsPanel.tsx',
      language: 'tsx',
      totalLineCount: 20,
      fileSizeBytes: 512,
      requestedStartLine: 1,
      requestedEndLine: 20,
      sourceText: 'export function BrowserFactsPanel() {}',
    };
    readSourceView.mockResolvedValue(response);

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });

    await expect(requestSelectedObjectSourceView('ws-1', state)).resolves.toEqual(response);
    expect(readSourceView).toHaveBeenCalledWith('ws-1', {
      snapshotId: 'snap-source-view-1',
      selectedObjectType: 'ENTITY',
      selectedObjectId: 'entity:component',
    });
  });

  test('rejects source view requests when there is no selected object', async () => {
    const state = createEmptyBrowserSessionState();

    await expect(requestSelectedObjectSourceView('ws-1', state)).rejects.toThrow(
      'No selected object is available for source view.',
    );
    expect(readSourceView).not.toHaveBeenCalled();
  });

  test('falls back to the selected scope when no focused element is available', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = selectBrowserScope(state, 'scope:file');

    expect(buildSelectedObjectSourceViewRequest(state)).toEqual({
      snapshotId: 'snap-source-view-1',
      selectedObjectType: 'SCOPE',
      selectedObjectId: 'scope:file',
    });
  });
});
