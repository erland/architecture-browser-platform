import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { FullSnapshotPayload, SnapshotSummary } from '../../../app-model';
import { BrowserGraphWorkspace, buildEntitySelectionActions } from '../../../components/browser-graph-workspace/BrowserGraphWorkspace';
import { createEmptyBrowserSessionState } from '../../../browser-session/state';
import { openSnapshotSession } from '../../../browser-session/lifecycle-api';
import type { BrowserSessionState } from '../../../browser-session/types';
import { buildBrowserSnapshotIndex } from '../../../browser-snapshot';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-graph-workspace-fixture',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-graph-fixture',
  snapshotKey: 'platform-main-graph-fixture',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-30T00:00:00Z',
  scopeCount: 2,
  entityCount: 4,
  relationshipCount: 2,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

export function createBrowserGraphWorkspaceFixturePayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java', 'react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:file', kind: 'FILE', name: 'src/BrowserView.tsx', displayName: 'src/BrowserView.tsx', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'info.example.browser', displayName: 'info.example.browser', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:module', kind: 'MODULE', origin: 'react', name: 'BrowserViewModule', displayName: 'BrowserViewModule', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:function.render', kind: 'FUNCTION', origin: 'react', name: 'renderBrowser', displayName: 'renderBrowser', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:function.layout', kind: 'FUNCTION', origin: 'react', name: 'computeLayout', displayName: 'computeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'SERVICE', origin: 'java', name: 'BrowserService', displayName: 'BrowserService', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:module:function1', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:function.render', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:function:calls', kind: 'CALLS', fromEntityId: 'entity:function.render', toEntityId: 'entity:service', label: 'calls', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

function renderWorkspace(state: BrowserSessionState) {
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
    onArrangeAllCanvasNodes: () => {},
    onArrangeCanvasAroundFocus: () => {},
    onClearCanvas: () => {},
    onFitView: () => {},
    onMoveCanvasNode: () => {},
    onReconcileCanvasNodePositions: () => {},
    onSetCanvasViewport: () => {},
  }));
}

export type BrowserGraphWorkspaceRegressionFixture = {
  name: string;
  run(): void;
};

export const BROWSER_GRAPH_WORKSPACE_REGRESSION_FIXTURES: BrowserGraphWorkspaceRegressionFixture[] = [
  {
    name: 'module selection action labels stay stable for entity-first toolbar rendering',
    run() {
      const index = buildBrowserSnapshotIndex(createBrowserGraphWorkspaceFixturePayload());
      const entity = index.entitiesById.get('entity:module');

      expect(entity).toBeDefined();
      expect(buildEntitySelectionActions(index, entity!).map((action) => action.label)).toEqual([
        'Contained (1)',
        'Functions (1)',
        'Dependencies',
        'Used by',
        'Remove',
        'Pin',
      ]);
    },
  },
  {
    name: 'focused relationship keeps routed edge markup visible in static workspace rendering',
    run() {
      let state = openSnapshotSession(createEmptyBrowserSessionState(), {
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        payload: createBrowserGraphWorkspaceFixturePayload(),
      });
      state = {
        ...state,
        canvasNodes: [
          { id: 'entity:function.render', kind: 'entity', x: 56, y: 64 },
          { id: 'entity:service', kind: 'entity', x: 320, y: 160 },
        ],
        focusedElement: { kind: 'relationship', id: 'rel:function:calls' },
      };

      const markup = renderWorkspace(state);
      expect(markup).toContain('marker-end="url(#browser-canvas-arrow)"');
      expect(markup).toContain('browser-canvas__edge browser-canvas__edge--focused');
      expect(markup).toContain('browser-canvas__edge-hitbox');
      expect(markup).toContain('calls');
    },
  },
];
