import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { addEntityToCanvas, createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, selectBrowserScope } from '../browserSessionStore';
import { buildBrowserFactsPanelPresentation } from '../components/BrowserFactsPanel';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-facts-presentation-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-facts',
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
  diagnosticCount: 1,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:file', kind: 'FILE', name: 'BrowserFactsPanel.tsx', displayName: 'src/components/BrowserFactsPanel.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:component', kind: 'COMPONENT', origin: 'react', name: 'BrowserFactsPanel', displayName: 'BrowserFactsPanel', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:helper', kind: 'FUNCTION', origin: 'react', name: 'buildBrowserFactsPanelPresentation', displayName: 'buildBrowserFactsPanelPresentation', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains', kind: 'CONTAINS', fromEntityId: 'entity:component', toEntityId: 'entity:helper', label: 'contains', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [
      { externalId: 'diag:component', severity: 'WARN', phase: 'IMPORT', code: 'WARN_COMPONENT', message: 'Component warning', fatal: false, filePath: 'src/components/BrowserFactsPanel.tsx', scopeId: null, entityId: 'entity:component', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('BrowserFactsPanel presentation', () => {
  test('builds section-specific scope presentation state', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload: createPayload() });
    state = selectBrowserScope(state, 'scope:file');

    const presentation = buildBrowserFactsPanelPresentation(state);

    expect(presentation?.scope?.summary).toEqual([
      'Display src/components/BrowserFactsPanel.tsx',
      'Path Platform / BrowserFactsPanel.tsx',
      'Parent Platform',
    ]);
    expect(presentation?.scope?.metrics.map((metric) => `${metric.label}:${metric.value}`)).toEqual([
      'Kind:FILE',
      'Has parent:Yes',
      'Child scopes:0',
      'Descendant scopes:0',
    ]);
  });

  test('builds entity header actions separately from entity facts', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload: createPayload() });
    state = addEntityToCanvas(state, 'entity:component');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });

    const presentation = buildBrowserFactsPanelPresentation(state);

    expect(presentation?.header.actions.pinEntityAction).toEqual({ entityId: 'entity:component', label: 'Pin entity' });
    expect(presentation?.entity?.outboundRelationships.map((relationship) => relationship.externalId)).toEqual(['rel:contains']);
  });
});
