import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserProjectionModel } from '../browser-projection';
import { clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { BrowserGraphWorkspace } from '../components/BrowserGraphWorkspace';
import {
  addEntityToCanvas,
  createEmptyBrowserSessionState,
  openSnapshotSession,
  setSelectedViewpoint,
  setViewpointPresentationPreference,
} from '../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-compact-uml-regression-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-compact-uml-regression',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 1,
  entityCount: 5,
  relationshipCount: 5,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'domain', displayName: 'Domain', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:customer', kind: 'CLASS', origin: 'java', name: 'Customer', displayName: 'Customer', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:customer:name', kind: 'FIELD', origin: 'java', name: 'name', displayName: 'name', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:order:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:order:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:customer:name', kind: 'CONTAINS', fromEntityId: 'entity:customer', toEntityId: 'entity:customer:name', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:order-calls-save', kind: 'USES', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: 'calls', sourceRefs: [], metadata: {} },
      { externalId: 'rel:order-uses-customer', kind: 'USES', fromEntityId: 'entity:order', toEntityId: 'entity:customer', label: 'references', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [
      {
        id: 'domain-model',
        title: 'Domain model',
        description: 'Show domain classifiers.',
        availability: 'available',
        confidence: 0.95,
        seedEntityIds: ['entity:order', 'entity:customer'],
        seedRoleIds: [],
        expandViaSemantics: [],
        preferredDependencyViews: ['structural-dependencies'],
        evidenceSources: ['java'],
      },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser compact UML regression coverage', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('suppresses member nodes but preserves classifier-to-classifier edges in compact UML mode', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = setSelectedViewpoint(state, 'domain-model');
    state = addEntityToCanvas(state, 'entity:order');
    state = addEntityToCanvas(state, 'entity:customer');
    state = {
      ...state,
      canvasNodes: [
        { id: 'entity:order', kind: 'entity', x: 40, y: 80 },
        { id: 'entity:order:id', kind: 'entity', x: 60, y: 220 },
        { id: 'entity:order:save', kind: 'entity', x: 150, y: 220 },
        { id: 'entity:customer', kind: 'entity', x: 360, y: 80 },
        { id: 'entity:customer:name', kind: 'entity', x: 380, y: 220 },
      ],
      canvasEdges: [
        { relationshipId: 'rel:contains:order:id', fromEntityId: 'entity:order', toEntityId: 'entity:order:id' },
        { relationshipId: 'rel:contains:order:save', fromEntityId: 'entity:order', toEntityId: 'entity:order:save' },
        { relationshipId: 'rel:contains:customer:name', fromEntityId: 'entity:customer', toEntityId: 'entity:customer:name' },
        { relationshipId: 'rel:order-calls-save', fromEntityId: 'entity:order', toEntityId: 'entity:order:save' },
        { relationshipId: 'rel:order-uses-customer', fromEntityId: 'entity:order', toEntityId: 'entity:customer' },
      ],
    };

    const projection = buildBrowserProjectionModel(state);

    expect(projection.presentationPolicy.mode).toBe('compact-uml');
    expect(projection.suppressedEntityIds).toEqual([
      'entity:customer:name',
      'entity:order:id',
      'entity:order:save',
    ]);
    expect(projection.nodes.map((node) => node.source.id).sort()).toEqual(['entity:customer', 'entity:order']);
    expect(projection.edges.map((edge) => edge.relationshipId)).toEqual(['rel:order-uses-customer']);
    expect(projection.edges[0]).toMatchObject({
      fromEntityId: 'entity:order',
      toEntityId: 'entity:customer',
      label: 'references',
    });
  });

  test('safe fallback preference keeps member entities as standalone nodes', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = setSelectedViewpoint(state, 'domain-model');
    state = setViewpointPresentationPreference(state, 'entity-graph');
    state = addEntityToCanvas(state, 'entity:order');
    state = {
      ...state,
      canvasNodes: [
        { id: 'entity:order', kind: 'entity', x: 40, y: 80 },
        { id: 'entity:order:id', kind: 'entity', x: 60, y: 220 },
        { id: 'entity:order:save', kind: 'entity', x: 150, y: 220 },
      ],
      canvasEdges: [
        { relationshipId: 'rel:contains:order:id', fromEntityId: 'entity:order', toEntityId: 'entity:order:id' },
        { relationshipId: 'rel:contains:order:save', fromEntityId: 'entity:order', toEntityId: 'entity:order:save' },
        { relationshipId: 'rel:order-calls-save', fromEntityId: 'entity:order', toEntityId: 'entity:order:save' },
      ],
    };

    const projection = buildBrowserProjectionModel(state);

    expect(projection.presentationPolicy.mode).toBe('entity-graph');
    expect(projection.suppressedEntityIds).toEqual([]);
    expect(projection.nodes.map((node) => `${node.kind}:${node.source.id}`).sort()).toEqual([
      'entity:entity:order',
      'entity:entity:order:id',
      'entity:entity:order:save',
    ]);
    expect(projection.edges.map((edge) => edge.relationshipId).sort()).toEqual([
      'rel:contains:order:id',
      'rel:contains:order:save',
      'rel:order-calls-save',
    ]);
  });

  test('renders member rows with selected and focused state classes backed by real entities', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = setSelectedViewpoint(state, 'domain-model');
    state = {
      ...state,
      canvasNodes: [{ id: 'entity:order', kind: 'entity', x: 40, y: 80 }],
      selectedEntityIds: ['entity:order:id'],
      focusedElement: { kind: 'entity', id: 'entity:order:save' },
    };

    const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Viewpoint',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('browser-canvas__uml-member-button--selected');
    expect(markup).toContain('browser-canvas__uml-member-button--focused');
    expect(markup).toContain('Order class details');
    expect(markup).toContain('id');
    expect(markup).toContain('save');
  });
});
