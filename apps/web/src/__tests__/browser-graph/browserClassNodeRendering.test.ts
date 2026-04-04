import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { BrowserGraphWorkspace } from '../../components/browser-graph-workspace/BrowserGraphWorkspace';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browser-session';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-class-node-rendering-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-class-node-rendering',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 1,
  entityCount: 3,
  relationshipCount: 2,
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
    ],
    relationships: [
      { externalId: 'rel:contains:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('class node rendering variants', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  function renderFor(classPresentation: { mode: 'simple' | 'compartments' | 'expanded'; showFields: boolean; showFunctions: boolean }) {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [{ id: 'entity:order', kind: 'entity', x: 40, y: 80, classPresentation }],
      focusedElement: { kind: 'entity', id: 'entity:order' },
      selectedEntityIds: ['entity:order'],
    };

    return renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Analysis',
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
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));
  }

  test('renders a simple class node without UML compartments', () => {
    const markup = renderFor({ mode: 'simple', showFields: true, showFunctions: true });

    expect(markup).toContain('data-class-presentation-mode="simple"');
    expect(markup).not.toContain('Order class details');
    expect(markup).not.toContain('Fields');
    expect(markup).not.toContain('Functions');
  });

  test('renders only the field compartment when fields are enabled', () => {
    const markup = renderFor({ mode: 'compartments', showFields: true, showFunctions: false });

    expect(markup).toContain('browser-canvas__node--class-compartments');
    expect(markup).toContain('browser-canvas__node--class-fields');
    expect(markup).toContain('data-class-compartments="attributes"');
    expect(markup).toContain('Order class details');
    expect(markup).toContain('Fields');
    expect(markup).toContain('id');
    expect(markup).not.toContain('Functions');
    expect(markup).not.toContain('save');
  });

  test('renders only the function compartment when functions are enabled', () => {
    const markup = renderFor({ mode: 'compartments', showFields: false, showFunctions: true });

    expect(markup).toContain('browser-canvas__node--class-functions');
    expect(markup).toContain('data-class-compartments="operations"');
    expect(markup).toContain('Functions');
    expect(markup).toContain('save');
    expect(markup).not.toContain('Fields');
    expect(markup).not.toContain('data-class-compartments="attributes"');
  });

  test('renders both compartments when both member categories are enabled', () => {
    const markup = renderFor({ mode: 'compartments', showFields: true, showFunctions: true });

    expect(markup).toContain('browser-canvas__node--class-fields');
    expect(markup).toContain('browser-canvas__node--class-functions');
    expect(markup).toContain('data-class-compartments="attributes,operations"');
    expect(markup).toContain('Fields');
    expect(markup).toContain('Functions');
    expect(markup).toContain('id');
    expect(markup).toContain('save');
  });

  test('falls back to simple rendering when both toggles are off', () => {
    const markup = renderFor({ mode: 'compartments', showFields: false, showFunctions: false });

    expect(markup).toContain('data-class-presentation-mode="simple"');
    expect(markup).not.toContain('Order class details');
    expect(markup).not.toContain('Fields');
    expect(markup).not.toContain('Functions');
  });
});
