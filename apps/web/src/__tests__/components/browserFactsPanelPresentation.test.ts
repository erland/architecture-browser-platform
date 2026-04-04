import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { addEntityToCanvas, createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, selectBrowserScope, setCanvasEntityClassPresentationMode, toggleCanvasEntityClassPresentationMembers } from '../../browser-session';
import { buildBrowserFactsPanelPresentation } from '../../components/browser-facts-panel/BrowserFactsPanel';

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
  entityCount: 4,
  relationshipCount: 3,
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
      { externalId: 'entity:field', kind: 'FIELD', origin: 'react', name: 'presentation', displayName: 'presentation', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:method', kind: 'METHOD', origin: 'react', name: 'render', displayName: 'render', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains-helper', kind: 'CONTAINS', fromEntityId: 'entity:component', toEntityId: 'entity:helper', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains-field', kind: 'CONTAINS', fromEntityId: 'entity:component', toEntityId: 'entity:field', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains-method', kind: 'CONTAINS', fromEntityId: 'entity:component', toEntityId: 'entity:method', label: 'contains', sourceRefs: [], metadata: {} },
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
    expect(presentation?.header.actions.classPresentationActions).toBeNull();
    expect(presentation?.entity?.outboundRelationships.map((relationship) => relationship.externalId)).toEqual(['rel:contains-helper', 'rel:contains-field', 'rel:contains-method']);
  });

  test('shows kind-specific entity summary and add action for tree-selected entities that are not on the canvas', () => {
    const payload = createPayload();
    payload.entities[0] = {
      ...payload.entities[0],
      kind: 'PAGE',
      displayName: 'OrdersPage',
      name: 'OrdersPage',
    };

    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });

    const presentation = buildBrowserFactsPanelPresentation(state);

    expect(presentation?.header.actions.addEntityAction).toEqual({ entityId: 'entity:component', label: 'Add entity to canvas' });
    expect(presentation?.header.actions.pinEntityAction).toBeNull();
    expect(presentation?.header.actions.canRemoveSelection).toBe(false);
    expect(presentation?.entity?.summary).toContain('OrdersPage is a UI page in src/components/BrowserFactsPanel.tsx.');
    expect(presentation?.entity?.summary).toContain('Selected from the tree only; not yet added to the canvas.');
    expect(presentation?.entity?.metrics.map((metric) => `${metric.label}:${metric.value}`)).toEqual([
      'Kind:PAGE',
      'Origin:react',
      'On canvas:No',
      'Source refs:0',
    ]);
  });

});


describe('BrowserFactsPanel class presentation actions', () => {


  test('adds compact inspector feedback for hidden member detail on class-like canvas nodes', () => {
    const payload = createPayload();
    payload.entities[0] = {
      ...payload.entities[0],
      kind: 'CLASS',
      displayName: 'BrowserFactsPanel',
      name: 'BrowserFactsPanel',
    };

    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = addEntityToCanvas(state, 'entity:component');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });
    state = setCanvasEntityClassPresentationMode(state, ['entity:component'], 'compartments');
    state = toggleCanvasEntityClassPresentationMembers(state, ['entity:component'], 'fields');

    const presentation = buildBrowserFactsPanelPresentation(state);

    expect(presentation?.entity?.classPresentationSummary).toEqual({
      mode: 'compartments',
      visibleDetails: [
        'Canvas presentation compartments.',
        'Functions are available (2).',
      ],
      hiddenDetails: [
        'Fields are hidden (1 available).',
        'Member detail is compacted into the class node (2 visible in compartments).',
      ],
    });
  });

  test('surfaces class presentation actions for class-like entities already on the canvas', () => {
    const payload = createPayload();
    payload.entities[0] = {
      ...payload.entities[0],
      kind: 'CLASS',
      displayName: 'BrowserFactsPanel',
      name: 'BrowserFactsPanel',
    };

    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = addEntityToCanvas(state, 'entity:component');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });

    const presentation = buildBrowserFactsPanelPresentation(state);

    expect(presentation?.header.actions.classPresentationActions).toEqual({
      entityIds: ['entity:component'],
      mode: 'simple',
      showFields: true,
      showFunctions: true,
    });
  });
});
