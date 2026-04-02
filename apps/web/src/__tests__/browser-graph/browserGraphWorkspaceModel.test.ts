import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { buildBrowserGraphWorkspaceModel } from '../../browser-graph';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  addScopeToCanvas,
  arrangeAllCanvasNodes,
  arrangeCanvasAroundFocus,
  createEmptyBrowserSessionState,
  focusBrowserElement,
  openSnapshotSession,
  toggleCanvasNodePin,
  setSelectedViewpoint,
} from '../../browser-session';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-graph-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-graph',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 2,
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
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'BrowserTopSearch', displayName: 'BrowserTopSearch', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
      { externalId: 'rel:2', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:search', label: 'queries', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}


function createParallelEdgePayload(): FullSnapshotPayload {
  const base = createPayload();
  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      relationshipCount: 4,
    },
    relationships: [
      ...base.relationships,
      { externalId: 'rel:1b', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'observes', sourceRefs: [], metadata: {} },
      { externalId: 'rel:1c', kind: 'USES', fromEntityId: 'entity:tree', toEntityId: 'entity:browser', label: 'back-link', sourceRefs: [], metadata: {} },
    ],
  };
}

describe('browserGraphWorkspaceModel', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('builds positioned scope/entity nodes and dependency edges from the browser session canvas', () => {
    const payload = createPayload();
    const index = buildBrowserSnapshotIndex(payload);
    expect(index.snapshotId).toBe('snap-graph-1');

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = focusBrowserElement(state, { kind: 'relationship', id: 'rel:1' });

    const model = buildBrowserGraphWorkspaceModel(state);

    expect(model.nodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:search', 'entity:tree', 'scope:web'].sort());
    expect(model.edges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:1', 'rel:2']);
    expect(model.nodes.find((node) => node.id === 'entity:browser')?.x).toBe(state.canvasNodes.find((node) => node.id === 'entity:browser')?.x);
    expect(model.nodes.find((node) => node.id === 'entity:browser')?.y).toBe(state.canvasNodes.find((node) => node.id === 'entity:browser')?.y);
    expect(model.nodes.find((node) => node.id === 'entity:browser')?.focused).toBe(false);
    expect(model.edges.find((edge) => edge.relationshipId === 'rel:1')?.focused).toBe(true);
    expect(model.edges.find((edge) => edge.relationshipId === 'rel:1')?.route.kind).toBe('polyline');
    expect((model.edges.find((edge) => edge.relationshipId === 'rel:1')?.route.points.length ?? 0)).toBeGreaterThanOrEqual(3);
    expect(model.edges.find((edge) => edge.relationshipId === 'rel:1')?.route.path).toContain('M ');
    expect(model.routingScene.obstacles.map((obstacle) => obstacle.nodeId).sort()).toEqual(['entity:browser', 'entity:search', 'entity:tree', 'scope:web'].sort());
    expect(model.edges.find((edge) => edge.relationshipId === 'rel:1')?.routingInput.obstacleNodeIds.sort()).toEqual(['entity:search', 'scope:web'].sort());
    expect(model.edges.find((edge) => edge.relationshipId === 'rel:1')?.routingInput.defaultStart.x).toBeGreaterThan((model.nodes.find((node) => node.id === 'entity:browser')?.x ?? 0));
    expect(model.width).toBeGreaterThan(600);
    expect(model.height).toBeGreaterThan(300);
  });


  test('recomputes routed edges when node positions change', () => {
    const payload = createPayload();

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');

    const initialModel = buildBrowserGraphWorkspaceModel(state);
    const movedState = {
      ...state,
      canvasNodes: state.canvasNodes.map((node) =>
        node.id === 'entity:tree' ? { ...node, x: node.x + 180, y: node.y + 120 } : node,
      ),
    };
    const movedModel = buildBrowserGraphWorkspaceModel(movedState);

    expect(initialModel.routingRevision).not.toBe(movedModel.routingRevision);
    expect(initialModel.edges.find((edge) => edge.relationshipId === 'rel:1')?.route.path)
      .not.toBe(movedModel.edges.find((edge) => edge.relationshipId === 'rel:1')?.route.path);
  });

  test('recomputes routed edges when visible graph relationships change', () => {
    const payload = createPayload();

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');

    const beforeDependencies = buildBrowserGraphWorkspaceModel(state);
    const withDependencies = buildBrowserGraphWorkspaceModel(addDependenciesToCanvas(state, 'entity:browser'));

    expect(beforeDependencies.routingRevision).not.toBe(withDependencies.routingRevision);
    expect(beforeDependencies.edges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:1']);
    expect(withDependencies.edges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:1', 'rel:2']);
  });

  test('arrange commands preserve anchored node positions while still rearranging eligible nodes', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:browser' });
    state = addDependenciesToCanvas(state, 'entity:browser');

    const initialModel = buildBrowserGraphWorkspaceModel(state);
    const focusedArrangedState = arrangeCanvasAroundFocus(state);
    const focusedArrangedModel = buildBrowserGraphWorkspaceModel(focusedArrangedState);
    const gridArrangedState = arrangeAllCanvasNodes(focusedArrangedState);
    const gridArrangedModel = buildBrowserGraphWorkspaceModel(gridArrangedState);

    expect(focusedArrangedState.canvasLayoutMode).toBe('radial');
    expect(gridArrangedState.canvasLayoutMode).toBe('structure');
    expect(initialModel.nodes.find((node) => node.id === 'entity:browser')?.x).toBe(focusedArrangedModel.nodes.find((node) => node.id === 'entity:browser')?.x);
    expect(initialModel.nodes.find((node) => node.id === 'entity:browser')?.y).toBe(focusedArrangedModel.nodes.find((node) => node.id === 'entity:browser')?.y);
    const movedNonAnchoredNode = focusedArrangedModel.nodes
      .filter((node) => node.id !== 'entity:browser')
      .some((node) => {
        const before = initialModel.nodes.find((candidate) => candidate.id === node.id);
        return before != null && (before.x !== node.x || before.y !== node.y);
      });

    expect(movedNonAnchoredNode).toBe(true);
    expect(gridArrangedModel.nodes.find((node) => node.id === 'entity:browser')?.pinned).toBe(true);
  });


  test('arrange pipeline bumps routing revision even when anchored geometry stays stable', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:browser' });
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:tree' });
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:search' });

    const beforeArrange = buildBrowserGraphWorkspaceModel(state);
    const arrangedState = arrangeCanvasAroundFocus(state);
    const afterArrange = buildBrowserGraphWorkspaceModel(arrangedState);

    expect(arrangedState.routeRefreshRequestedAt).not.toBeNull();
    expect(beforeArrange.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })))
      .toEqual(afterArrange.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })));
    expect(beforeArrange.routingRevision).not.toBe(afterArrange.routingRevision);
    expect(beforeArrange.edges.map((edge) => edge.route.path)).toEqual(afterArrange.edges.map((edge) => edge.route.path));
  });

  test('arrange commands preserve anchored node positions in the rendered model', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:browser' });
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:tree' });
    const pinnedBefore = state.canvasNodes.find((node) => node.id === 'entity:tree');

    const arrangedState = arrangeCanvasAroundFocus(state);
    const arrangedModel = buildBrowserGraphWorkspaceModel(arrangedState);

    expect(arrangedModel.nodes.find((node) => node.id === 'entity:tree')?.x).toBe(pinnedBefore?.x);
    expect(arrangedModel.nodes.find((node) => node.id === 'entity:tree')?.y).toBe(pinnedBefore?.y);
  });

  test('carries compact UML classifier compartments into the workspace model for class-centric viewpoints', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
        entities: [
          { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
          { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
          { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
        ],
        relationships: [
          { externalId: 'rel:contains:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
          { externalId: 'rel:contains:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
        ],
        viewpoints: [
          { id: 'domain-model', title: 'Domain model', description: 'Show domain classifiers.', availability: 'available', confidence: 0.9, seedEntityIds: ['entity:order'], seedRoleIds: [], expandViaSemantics: [], preferredDependencyViews: ['structural-dependencies'], evidenceSources: ['java'] },
        ],
      },
    });
    state = setSelectedViewpoint(state, 'domain-model');
    state = addEntityToCanvas(state, 'entity:order');

    const model = buildBrowserGraphWorkspaceModel(state);
    const orderNode = model.nodes.find((node) => node.id === 'entity:order');

    expect(model.presentationMode).toBe('compact-uml');
    expect(model.suppressedEntityIds).toEqual(['entity:order:id', 'entity:order:save']);
    expect(model.nodes.map((node) => node.id)).toEqual(['entity:order']);
    expect(model.edges).toEqual([]);
    expect(orderNode?.kind).toBe('uml-class');
    expect(orderNode?.memberEntityIds).toEqual(['entity:order:id', 'entity:order:save']);
    expect(orderNode?.compartments.map((compartment) => compartment.kind)).toEqual(['attributes', 'operations']);
  });



  test('respects conservative routing flags by allowing straight fallback rendering', () => {
    const payload = createPayload();

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');
    state = {
      ...state,
      routingLayoutConfig: {
        ...state.routingLayoutConfig,
        features: {
          ...state.routingLayoutConfig.features,
          orthogonalRouting: false,
        },
      },
    };

    const model = buildBrowserGraphWorkspaceModel(state);
    const edge = model.edges.find((candidate) => candidate.relationshipId === 'rel:1');

    expect(edge?.route.kind).toBe('straight');
    expect(edge?.route.points).toHaveLength(2);
    expect(edge?.route.points[0]).toEqual(edge?.routingInput.defaultStart);
    expect(edge?.route.points[1]).toEqual(edge?.routingInput.defaultEnd);
  });

  test('respects lane-separation flag and conservative lane-count limit', () => {
    const payload = createParallelEdgePayload();

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:tree');

    const separatedModel = buildBrowserGraphWorkspaceModel(state);
    const separatedOffsets = separatedModel.edges
      .filter((edge) => ['rel:1', 'rel:1b', 'rel:1c'].includes(edge.relationshipId))
      .map((edge) => edge.laneOffset);

    const disabledState = {
      ...state,
      routingLayoutConfig: {
        ...state.routingLayoutConfig,
        features: {
          ...state.routingLayoutConfig.features,
          laneSeparation: false,
        },
      },
    };
    const disabledModel = buildBrowserGraphWorkspaceModel(disabledState);
    const disabledOffsets = disabledModel.edges
      .filter((edge) => ['rel:1', 'rel:1b', 'rel:1c'].includes(edge.relationshipId))
      .map((edge) => edge.laneOffset);

    const limitedState = {
      ...state,
      routingLayoutConfig: {
        ...state.routingLayoutConfig,
        defaults: {
          ...state.routingLayoutConfig.defaults,
          maxLaneCountForSpacing: 2,
        },
      },
    };
    const limitedModel = buildBrowserGraphWorkspaceModel(limitedState);
    const limitedOffsets = limitedModel.edges
      .filter((edge) => ['rel:1', 'rel:1b', 'rel:1c'].includes(edge.relationshipId))
      .map((edge) => edge.laneOffset);

    expect(separatedOffsets.some((offset) => offset !== 0)).toBe(true);
    expect(disabledOffsets.every((offset) => offset === 0)).toBe(true);
    expect(limitedOffsets.every((offset) => offset === 0)).toBe(true);
  });

  test('chooses clamped side anchors and adjusted endpoint stubs for vertically stacked nodes', () => {
    const payload = createPayload();
    buildBrowserSnapshotIndex(payload);

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');

    state = {
      ...state,
      canvasNodes: state.canvasNodes.map((node) => {
        if (node.id === 'entity:browser') {
          return { ...node, x: 120, y: 80 };
        }
        if (node.id === 'entity:tree') {
          return { ...node, x: 150, y: 280 };
        }
        return node;
      }),
    };

    const model = buildBrowserGraphWorkspaceModel(state);
    const edge = model.edges.find((candidate) => candidate.relationshipId === 'rel:1');
    const source = model.nodes.find((node) => node.id === 'entity:browser');
    const target = model.nodes.find((node) => node.id === 'entity:tree');

    expect(edge).toBeTruthy();
    expect(source).toBeTruthy();
    expect(target).toBeTruthy();
    if (!edge || !source || !target) {
      throw new Error('Expected edge, source, and target nodes to be present');
    }
    expect(edge.routingInput.preferredStartSide).toBe('bottom');
    expect(edge.routingInput.preferredEndSide).toBe('top');
    expect(edge.routingInput.defaultStart.x).toBeGreaterThan(source.x + 10);
    expect(edge.routingInput.defaultStart.x).toBeLessThan(source.x + source.width - 10);
    expect(edge.route.points[0]?.y).toBe(source.y + source.height);
    expect(edge.route.points[1]?.y).toBeGreaterThan(edge.route.points[0]?.y ?? 0);
    expect(edge.route.points[edge.route.points.length - 1]?.y).toBe(target.y);
  });


  test('adds lane separation for parallel edges between the same nodes', () => {
    const payload = createParallelEdgePayload();
    buildBrowserSnapshotIndex(payload);

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');

    state = {
      ...state,
      canvasNodes: state.canvasNodes.map((node) => {
        if (node.id === 'entity:browser') {
          return { ...node, x: 100, y: 120 };
        }
        if (node.id === 'entity:tree') {
          return { ...node, x: 420, y: 120 };
        }
        return node;
      }),
    };

    const model = buildBrowserGraphWorkspaceModel(state);
    const rel1 = model.edges.find((edge) => edge.relationshipId === 'rel:1');
    const rel1b = model.edges.find((edge) => edge.relationshipId === 'rel:1b');
    const rel1c = model.edges.find((edge) => edge.relationshipId === 'rel:1c');

    expect(rel1).toBeTruthy();
    expect(rel1b).toBeTruthy();
    expect(rel1c).toBeTruthy();
    expect(new Set([rel1?.laneOffset, rel1b?.laneOffset, rel1c?.laneOffset]).size).toBe(3);
    expect([rel1?.laneOffset, rel1b?.laneOffset, rel1c?.laneOffset]).toContain(0);
    expect(rel1?.laneOffset).not.toBe(rel1b?.laneOffset);
    expect(rel1c?.laneOffset).not.toBe(rel1b?.laneOffset);
    expect(rel1?.route.path).not.toBe(rel1b?.route.path);
    expect(rel1c?.route.path).not.toBe(rel1b?.route.path);
    expect(rel1?.route.points[0]?.y).not.toBe(rel1b?.route.points[0]?.y);
    expect(rel1c?.route.points[0]?.y).not.toBe(rel1b?.route.points[0]?.y);
  });

  test('routes around visible obstacle nodes when building workspace edges', () => {
    const payload = createPayload();
    buildBrowserSnapshotIndex(payload);

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:tree');
    state = addEntityToCanvas(state, 'entity:search');

    state = {
      ...state,
      canvasNodes: state.canvasNodes.map((node) => {
        if (node.id === 'entity:browser') {
          return { ...node, x: 100, y: 120 };
        }
        if (node.id === 'entity:tree') {
          return { ...node, x: 420, y: 120 };
        }
        if (node.id === 'entity:search') {
          return { ...node, x: 240, y: 90 };
        }
        return node;
      }),
    };

    const model = buildBrowserGraphWorkspaceModel(state);
    const edge = model.edges.find((candidate) => candidate.relationshipId === 'rel:1');

    expect(edge).toBeTruthy();
    expect(edge?.route.path).not.toBe(`M ${edge?.routingInput.defaultStart.x} ${edge?.routingInput.defaultStart.y} L ${edge?.routingInput.defaultEnd.x} ${edge?.routingInput.defaultEnd.y}`);
    expect((edge?.route.points.length ?? 0)).toBeGreaterThanOrEqual(2);
    expect(edge?.route.points[0]?.y).not.toBe(edge?.routingInput.defaultStart.y);
    expect(edge?.route.points[1]?.y).toBe(edge?.route.points[0]?.y);
  });

});
