import { getProjectionAwareCanvasNodeSize } from '../../browser-graph';
import { createEmptyBrowserSessionState } from '../../browser-session/state';
import { arrangeCanvasNodesInGrid, planEntityInsertion } from '../../browser-canvas-placement';
import {
  attachBrowserAutoLayoutComponents,
  detectBrowserAutoLayoutComponents,
  extractBrowserAutoLayoutGraph,
  mapBrowserAutoLayoutNodeToComponentId,
  runBrowserAutoLayout,
  runBrowserFlowAutoLayout,
  runBrowserHierarchyAutoLayout,
} from '../../browser-auto-layout';

describe('browser auto-layout subsystem skeleton', () => {
  it('extracts the visible layout graph with layout metadata and excludes non-visible edges', () => {
    const state = createEmptyBrowserSessionState();
    state.index = {
      ...state.index,
      entitiesById: new Map([
        ['entity-a', { externalId: 'entity-a', kind: 'SERVICE', origin: null, name: 'A', displayName: 'A', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
        ['entity-b', { externalId: 'entity-b', kind: 'SERVICE', origin: null, name: 'B', displayName: 'B', scopeId: 'scope-b', sourceRefs: [], metadata: {} }],
        ['entity-c', { externalId: 'entity-c', kind: 'SERVICE', origin: null, name: 'C', displayName: 'C', scopeId: 'scope-c', sourceRefs: [], metadata: {} }],
      ]),
      relationshipsById: new Map([
        ['rel-a', { externalId: 'rel-a', kind: 'DEPENDS_ON', fromEntityId: 'entity-a', toEntityId: 'entity-b', label: 'A→B', sourceRefs: [], metadata: {} }],
        ['rel-hidden', { externalId: 'rel-hidden', kind: 'DEPENDS_ON', fromEntityId: 'entity-a', toEntityId: 'entity-x', label: 'hidden', sourceRefs: [], metadata: {} }],
      ]),
    } as any;
    state.selectedEntityIds = ['entity-b'];
    state.focusedElement = { kind: 'entity', id: 'entity-a' };

    const graph = extractBrowserAutoLayoutGraph({
      mode: 'flow',
      state,
      nodes: [
        { kind: 'scope', id: 'scope-a', x: 10, y: 20 },
        { kind: 'entity', id: 'entity-a', x: 100, y: 120, manuallyPlaced: true },
        { kind: 'entity', id: 'entity-b', x: 260, y: 120, pinned: true },
        { kind: 'entity', id: 'entity-c', x: 420, y: 120 },
      ],
      edges: [
        { relationshipId: 'rel-a', fromEntityId: 'entity-a', toEntityId: 'entity-b' },
        { relationshipId: 'rel-hidden', fromEntityId: 'entity-a', toEntityId: 'entity-x' },
      ],
    });

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toEqual([
      {
        relationshipId: 'rel-a',
        fromEntityId: 'entity-a',
        toEntityId: 'entity-b',
        kind: 'DEPENDS_ON',
        label: 'A→B',
      },
    ]);
    expect(graph.focusedNodeId).toBe('entity-a');
    expect(graph.anchorNodeId).toBe('entity-a');
    expect(graph.selectedNodeIds).toEqual(['entity-b']);
    expect(graph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'scope',
        id: 'scope-a',
        scopeId: 'scope-a',
        selected: false,
        focused: false,
        incidentCount: 0,
        width: expect.any(Number),
        height: expect.any(Number),
      }),
      expect.objectContaining({
        kind: 'entity',
        id: 'entity-a',
        scopeId: 'scope-a',
        focused: true,
        anchored: true,
        manuallyPlaced: true,
        outboundCount: 1,
        inboundCount: 0,
        incidentCount: 1,
      }),
      expect.objectContaining({
        kind: 'entity',
        id: 'entity-b',
        scopeId: 'scope-b',
        selected: true,
        anchored: true,
        pinned: true,
        outboundCount: 0,
        inboundCount: 1,
        incidentCount: 1,
      }),
      expect.objectContaining({
        kind: 'entity',
        id: 'entity-c',
        scopeId: 'scope-c',
        selected: false,
        focused: false,
        anchored: false,
        incidentCount: 0,
      }),
    ]));

    expect(graph.components).toEqual([
      {
        id: 'component-1',
        nodeIds: ['entity-a', 'entity-b'],
        edgeIds: ['rel-a'],
        anchoredNodeIds: ['entity-a', 'entity-b'],
        nodeCount: 2,
        edgeCount: 1,
      },
      {
        id: 'component-2',
        nodeIds: ['entity-c'],
        edgeIds: [],
        anchoredNodeIds: [],
        nodeCount: 1,
        edgeCount: 0,
      },
      {
        id: 'component-3',
        nodeIds: ['scope-a'],
        edgeIds: [],
        anchoredNodeIds: [],
        nodeCount: 1,
        edgeCount: 0,
      },
    ]);
    expect(graph.nodeToComponentId).toEqual({
      'entity-a': 'component-1',
      'entity-b': 'component-1',
      'entity-c': 'component-2',
      'scope-a': 'component-3',
    });
  });

  it('detects connected components and anchored membership for ad hoc graphs', () => {
    const graph = attachBrowserAutoLayoutComponents({
      nodes: [
        { kind: 'entity', id: 'a', key: 'entity:a', x: 0, y: 0, width: 10, height: 10, pinned: false, manuallyPlaced: false, selected: false, focused: false, anchored: false, scopeId: null, inboundCount: 0, outboundCount: 1, incidentCount: 1 },
        { kind: 'entity', id: 'b', key: 'entity:b', x: 0, y: 0, width: 10, height: 10, pinned: true, manuallyPlaced: false, selected: false, focused: false, anchored: true, scopeId: null, inboundCount: 1, outboundCount: 0, incidentCount: 1 },
        { kind: 'entity', id: 'c', key: 'entity:c', x: 0, y: 0, width: 10, height: 10, pinned: false, manuallyPlaced: false, selected: false, focused: false, anchored: false, scopeId: null, inboundCount: 0, outboundCount: 0, incidentCount: 0 },
      ],
      edges: [
        { relationshipId: 'rel-1', fromEntityId: 'a', toEntityId: 'b', kind: null, label: null },
      ],
      focusedNodeId: null,
      anchorNodeId: null,
      selectedNodeIds: [],
    });

    expect(detectBrowserAutoLayoutComponents(graph)).toEqual([
      {
        id: 'component-1',
        nodeIds: ['a', 'b'],
        edgeIds: ['rel-1'],
        anchoredNodeIds: ['b'],
        nodeCount: 2,
        edgeCount: 1,
      },
      {
        id: 'component-2',
        nodeIds: ['c'],
        edgeIds: [],
        anchoredNodeIds: [],
        nodeCount: 1,
        edgeCount: 0,
      },
    ]);
    expect(mapBrowserAutoLayoutNodeToComponentId(graph.components)).toEqual({
      a: 'component-1',
      b: 'component-1',
      c: 'component-2',
    });
  });





  it('uses the shared graph model to place a newly added entity near a related visible neighbor', () => {
    const state = createEmptyBrowserSessionState();
    state.index = {
      ...state.index,
      entitiesById: new Map([
        ['scope-a-anchor', { externalId: 'scope-a-anchor', kind: 'SERVICE', origin: null, name: 'Anchor', displayName: 'Anchor', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
        ['scope-a-peer', { externalId: 'scope-a-peer', kind: 'SERVICE', origin: null, name: 'Peer', displayName: 'Peer', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
        ['scope-a-new', { externalId: 'scope-a-new', kind: 'SERVICE', origin: null, name: 'New', displayName: 'New', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
      ]),
      relationshipsById: new Map([
        ['rel-anchor-new', { externalId: 'rel-anchor-new', kind: 'DEPENDS_ON', fromEntityId: 'scope-a-anchor', toEntityId: 'scope-a-new', label: 'anchor→new', sourceRefs: [], metadata: {} }],
      ]),
    } as any;
    state.canvasNodes = [
      { kind: 'scope', id: 'scope-a', x: 80, y: 80 },
      { kind: 'entity', id: 'scope-a-anchor', x: 600, y: 220 },
      { kind: 'entity', id: 'scope-a-peer', x: 920, y: 220 },
    ];
    state.canvasEdges = [];
    state.focusedElement = { kind: 'entity', id: 'scope-a-anchor' };

    const placement = planEntityInsertion(
      state.canvasNodes,
      state.index!,
      state.index!.entitiesById.get('scope-a-new')!,
      undefined,
      { state },
    );

    expect(placement.x).toBeGreaterThan(state.canvasNodes[1].x);
    expect(placement.x).toBeLessThan(state.canvasNodes[2].x);
    expect(Math.abs(placement.y - state.canvasNodes[1].y)).toBeLessThanOrEqual(160);
  });

  it('keeps explicit anchored insertion directions for dependency expansion flows', () => {
    const state = createEmptyBrowserSessionState();
    state.index = {
      ...state.index,
      entitiesById: new Map([
        ['anchor', { externalId: 'anchor', kind: 'SERVICE', origin: null, name: 'Anchor', displayName: 'Anchor', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
        ['incoming', { externalId: 'incoming', kind: 'SERVICE', origin: null, name: 'Incoming', displayName: 'Incoming', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
      ]),
      relationshipsById: new Map([
        ['rel-incoming-anchor', { externalId: 'rel-incoming-anchor', kind: 'DEPENDS_ON', fromEntityId: 'incoming', toEntityId: 'anchor', label: 'incoming→anchor', sourceRefs: [], metadata: {} }],
      ]),
    } as any;
    state.canvasNodes = [
      { kind: 'entity', id: 'anchor', x: 500, y: 300 },
    ];

    const placement = planEntityInsertion(
      state.canvasNodes,
      state.index!,
      state.index!.entitiesById.get('incoming')!,
      { anchorEntityId: 'anchor', anchorDirection: 'left' },
      { state },
    );

    expect(placement.x).toBeLessThan(state.canvasNodes[0].x);
  });

  it('uses a graph-aware default Structure layout and keeps disconnected groups separated', () => {
    const state = createEmptyBrowserSessionState();
    state.focusedElement = { kind: 'entity', id: 'entity-a' };
    state.canvasNodes = [
      { kind: 'entity', id: 'entity-a', x: 1200, y: 900 },
      { kind: 'entity', id: 'entity-b', x: 1400, y: 900 },
      { kind: 'entity', id: 'entity-c', x: 1600, y: 900 },
      { kind: 'entity', id: 'entity-d', x: 1800, y: 900 },
      { kind: 'entity', id: 'entity-e', x: 2000, y: 900 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-ab', fromEntityId: 'entity-a', toEntityId: 'entity-b' },
      { relationshipId: 'rel-ac', fromEntityId: 'entity-a', toEntityId: 'entity-c' },
      { relationshipId: 'rel-de', fromEntityId: 'entity-d', toEntityId: 'entity-e' },
    ];

    const result = runBrowserAutoLayout({
      mode: 'structure',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(result.mode).toBe('structure');
    expect(nodesById['entity-a'].x).toBeLessThan(nodesById['entity-b'].x);
    expect(nodesById['entity-a'].x).toBeLessThan(nodesById['entity-c'].x);
    expect(Math.abs(nodesById['entity-b'].y - nodesById['entity-c'].y)).toBeLessThanOrEqual(120);
    expect(nodesById['entity-d'].y).toBeGreaterThan(nodesById['entity-b'].y);
    expect(nodesById['entity-e'].x).toBeGreaterThanOrEqual(nodesById['entity-d'].x);
  });


  it('keeps free nodes arranged around a pinned anchor instead of collapsing the whole component origin', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'anchor', x: 320, y: 240, pinned: true },
      { kind: 'entity', id: 'left', x: 1200, y: 1000 },
      { kind: 'entity', id: 'right', x: 1400, y: 1000 },
      { kind: 'entity', id: 'far', x: 1600, y: 1000 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-anchor-left', fromEntityId: 'anchor', toEntityId: 'left' },
      { relationshipId: 'rel-anchor-right', fromEntityId: 'anchor', toEntityId: 'right' },
      { relationshipId: 'rel-right-far', fromEntityId: 'right', toEntityId: 'far' },
    ];

    const result = runBrowserAutoLayout({
      mode: 'structure',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(nodesById['anchor']).toEqual(expect.objectContaining({ x: 320, y: 240, pinned: true }));
    expect(nodesById['left'].x).toBeGreaterThan(nodesById['anchor'].x);
    expect(nodesById['right'].x).toBeGreaterThan(nodesById['anchor'].x);
    expect(Math.abs(nodesById['left'].y - nodesById['anchor'].y)).toBeLessThanOrEqual(120);
    expect(Math.abs(nodesById['right'].y - nodesById['anchor'].y)).toBeLessThanOrEqual(120);
    expect(nodesById['far'].x).toBeGreaterThan(nodesById['right'].x);
  });

  it('treats manually placed nodes as conservative fixed anchors in the first pass', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'manual', x: 560, y: 480, manuallyPlaced: true },
      { kind: 'entity', id: 'child-a', x: 1500, y: 1000 },
      { kind: 'entity', id: 'child-b', x: 1700, y: 1000 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-manual-a', fromEntityId: 'manual', toEntityId: 'child-a' },
      { relationshipId: 'rel-manual-b', fromEntityId: 'manual', toEntityId: 'child-b' },
    ];

    const result = runBrowserAutoLayout({
      mode: 'structure',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(nodesById['manual']).toEqual(expect.objectContaining({ x: 560, y: 480, manuallyPlaced: true }));
    expect(nodesById['child-a'].x).toBeGreaterThan(nodesById['manual'].x);
    expect(nodesById['child-b'].x).toBeGreaterThan(nodesById['manual'].x);
  });


  it('is deterministic for the same Structure layout input and preserves pinned nodes', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'entity-a', x: 900, y: 900 },
      { kind: 'entity', id: 'entity-b', x: 120, y: 180, pinned: true },
      { kind: 'entity', id: 'entity-c', x: 1100, y: 900 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-ab', fromEntityId: 'entity-a', toEntityId: 'entity-b' },
      { relationshipId: 'rel-bc', fromEntityId: 'entity-b', toEntityId: 'entity-c' },
    ];

    const request = {
      mode: 'structure' as const,
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    };

    const first = runBrowserAutoLayout(request);
    const second = runBrowserAutoLayout(request);

    expect(first.nodes).toEqual(second.nodes);
    expect(first.nodes.find((node) => node.id === 'entity-b')).toEqual(expect.objectContaining({ x: 120, y: 180, pinned: true }));
  });

  it('keeps Arrange all behavior stable while routing through the new subsystem', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'scope', id: 'scope-a', x: 400, y: 400 },
      { kind: 'entity', id: 'entity-a', x: 800, y: 800 },
      { kind: 'entity', id: 'entity-b', x: 1000, y: 1000, pinned: true },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-a', fromEntityId: 'entity-a', toEntityId: 'entity-b' },
    ];

    const gridNodes = arrangeCanvasNodesInGrid(state.canvasNodes, { state });
    const autoLayoutResult = runBrowserAutoLayout({
      mode: 'structure',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    expect(autoLayoutResult.mode).toBe('structure');
    expect(autoLayoutResult.canvasLayoutMode).toBe('structure');
    expect(autoLayoutResult.nodes).not.toEqual(state.canvasNodes);
    expect(autoLayoutResult.nodes).not.toEqual(gridNodes);
  });

  it('places directed chains left-to-right in Flow layout mode', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'source', x: 1400, y: 700 },
      { kind: 'entity', id: 'middle', x: 200, y: 300 },
      { kind: 'entity', id: 'sink', x: 700, y: 1200 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-source-middle', fromEntityId: 'source', toEntityId: 'middle' },
      { relationshipId: 'rel-middle-sink', fromEntityId: 'middle', toEntityId: 'sink' },
    ];

    const result = runBrowserFlowAutoLayout({
      mode: 'flow',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(result.mode).toBe('flow');
    expect(result.canvasLayoutMode).toBe('flow');
    expect(nodesById['source'].x).toBeLessThan(nodesById['middle'].x);
    expect(nodesById['middle'].x).toBeLessThan(nodesById['sink'].x);
  });

  it('keeps anchored nodes fixed and places inbound and outbound neighbors on opposite sides in Flow layout mode', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'anchor', x: 900, y: 500, pinned: true },
      { kind: 'entity', id: 'upstream', x: 150, y: 1500 },
      { kind: 'entity', id: 'downstream', x: 1700, y: 1500 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-upstream-anchor', fromEntityId: 'upstream', toEntityId: 'anchor' },
      { relationshipId: 'rel-anchor-downstream', fromEntityId: 'anchor', toEntityId: 'downstream' },
    ];

    const result = runBrowserFlowAutoLayout({
      mode: 'flow',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(nodesById['anchor']).toEqual(expect.objectContaining({ x: 900, y: 500, pinned: true }));
    expect(nodesById['upstream'].x).toBeLessThan(nodesById['anchor'].x);
    expect(nodesById['downstream'].x).toBeGreaterThan(nodesById['anchor'].x);
  });

  it('places parent-child chains top-to-bottom in Hierarchy layout mode', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'root', x: 1300, y: 900 },
      { kind: 'entity', id: 'child', x: 200, y: 100 },
      { kind: 'entity', id: 'grandchild', x: 900, y: 1500 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-root-child', fromEntityId: 'root', toEntityId: 'child' },
      { relationshipId: 'rel-child-grandchild', fromEntityId: 'child', toEntityId: 'grandchild' },
    ];

    const result = runBrowserHierarchyAutoLayout({
      mode: 'hierarchy',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(result.mode).toBe('hierarchy');
    expect(result.canvasLayoutMode).toBe('hierarchy');
    expect(nodesById['root'].y).toBeLessThan(nodesById['child'].y);
    expect(nodesById['child'].y).toBeLessThan(nodesById['grandchild'].y);
    expect(Math.abs(nodesById['root'].x - nodesById['child'].x)).toBeLessThanOrEqual(220);
    expect(Math.abs(nodesById['child'].x - nodesById['grandchild'].x)).toBeLessThanOrEqual(220);
  });


  it('keeps sibling ordering more stable across Structure bands using neighbor-aware ordering', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'root', x: 1500, y: 700 },
      { kind: 'entity', id: 'left-parent', x: 100, y: 1200 },
      { kind: 'entity', id: 'right-parent', x: 2200, y: 1200 },
      { kind: 'entity', id: 'left-leaf', x: 600, y: 1800 },
      { kind: 'entity', id: 'right-leaf', x: 1800, y: 1800 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-root-left', fromEntityId: 'root', toEntityId: 'left-parent' },
      { relationshipId: 'rel-root-right', fromEntityId: 'root', toEntityId: 'right-parent' },
      { relationshipId: 'rel-left-leaf', fromEntityId: 'left-parent', toEntityId: 'left-leaf' },
      { relationshipId: 'rel-right-leaf', fromEntityId: 'right-parent', toEntityId: 'right-leaf' },
    ];

    const result = runBrowserAutoLayout({
      mode: 'structure',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(nodesById['left-parent'].y).toBeLessThan(nodesById['right-parent'].y);
    expect(nodesById['left-leaf'].y).toBeLessThan(nodesById['right-leaf'].y);
  });

  it('keeps anchored nodes fixed and places inbound above and outbound below in Hierarchy layout mode', () => {
    const state = createEmptyBrowserSessionState();
    state.canvasNodes = [
      { kind: 'entity', id: 'anchor', x: 900, y: 500, pinned: true },
      { kind: 'entity', id: 'parent', x: 120, y: 1600 },
      { kind: 'entity', id: 'child', x: 1700, y: 1600 },
    ];
    state.canvasEdges = [
      { relationshipId: 'rel-parent-anchor', fromEntityId: 'parent', toEntityId: 'anchor' },
      { relationshipId: 'rel-anchor-child', fromEntityId: 'anchor', toEntityId: 'child' },
    ];

    const result = runBrowserHierarchyAutoLayout({
      mode: 'hierarchy',
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      options: { state },
      state,
    });

    const nodesById = Object.fromEntries(result.nodes.map((node) => [node.id, node]));
    expect(nodesById['anchor']).toEqual(expect.objectContaining({ x: 900, y: 500, pinned: true }));
    expect(nodesById['parent'].y).toBeLessThan(nodesById['anchor'].y);
    expect(nodesById['child'].y).toBeGreaterThan(nodesById['anchor'].y);
  });

});

describe('browser auto-layout configuration', () => {
  it('resolves conservative defaults', async () => {
    const { DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG, resolveBrowserAutoLayoutConfig } = await import('../../browser-auto-layout');

    expect(resolveBrowserAutoLayoutConfig()).toEqual(DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG);
    expect(DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG).toEqual(expect.objectContaining({
      defaultMode: 'structure',
      pinnedNodesAreHardAnchors: true,
      manualNodesAreHardAnchors: true,
      cleanupIntensity: 'basic',
      enableOrderingHeuristics: true,
    }));
  });

  it('applies spacing overrides while remaining usable when cleanup and heuristics are disabled', () => {
    const result = runBrowserAutoLayout({
      mode: 'structure',
      nodes: [
        { kind: 'entity', id: 'a', x: 0, y: 0 },
        { kind: 'entity', id: 'b', x: 0, y: 0 },
        { kind: 'entity', id: 'c', x: 0, y: 0 },
      ],
      edges: [
        { relationshipId: 'rel-ab', fromEntityId: 'a', toEntityId: 'b' },
        { relationshipId: 'rel-bc', fromEntityId: 'b', toEntityId: 'c' },
      ],
      config: {
        horizontalSpacing: 320,
        verticalSpacing: 180,
        cleanupIntensity: 'none',
        enableOrderingHeuristics: false,
      },
    });

    const byId = new Map(result.nodes.map((node) => [node.id, node]));
    expect(byId.get('b')?.x).toBe((byId.get('a')?.x ?? 0) + 320);
    expect(byId.get('c')?.x).toBe((byId.get('b')?.x ?? 0) + 320);
    expect(result.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true);
  });


  it('adds extra clearance for compact UML classifier nodes so tall classes do not overlap', () => {
    const state = createEmptyBrowserSessionState();
    state.viewpointPresentationPreference = 'compact-uml';
    state.appliedViewpoint = {
      viewpoint: { id: 'persistence-model' } as any,
      selectedScopeId: null,
      scopeIds: [],
      entityIds: [],
      relationshipIds: [],
      diagnostics: [],
    } as any;
    const entities = new Map<string, any>([
      ['aggregate-root', { externalId: 'aggregate-root', kind: 'CLASS', origin: null, name: 'AggregateRoot', displayName: 'AggregateRoot', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
      ['child-a', { externalId: 'child-a', kind: 'CLASS', origin: null, name: 'ChildA', displayName: 'ChildA', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
      ['child-b', { externalId: 'child-b', kind: 'CLASS', origin: null, name: 'ChildB', displayName: 'ChildB', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
    ]);
    for (const ownerId of ['aggregate-root', 'child-a', 'child-b']) {
      for (let index = 0; index < 10; index += 1) {
        entities.set(`${ownerId}-field-${index}`, { externalId: `${ownerId}-field-${index}`, kind: 'FIELD', origin: null, name: `field${index}`, displayName: `field${index}`, scopeId: 'scope-a', sourceRefs: [], metadata: {} });
        entities.set(`${ownerId}-method-${index}`, { externalId: `${ownerId}-method-${index}`, kind: 'METHOD', origin: null, name: `method${index}`, displayName: `method${index}`, scopeId: 'scope-a', sourceRefs: [], metadata: {} });
      }
    }
    state.index = {
      ...state.index,
      entitiesById: entities,
      containedEntityIdsByEntityId: new Map([
        ['aggregate-root', [...Array.from({ length: 10 }, (_, index) => `aggregate-root-field-${index}`), ...Array.from({ length: 10 }, (_, index) => `aggregate-root-method-${index}`)]],
        ['child-a', [...Array.from({ length: 10 }, (_, index) => `child-a-field-${index}`), ...Array.from({ length: 10 }, (_, index) => `child-a-method-${index}`)]],
        ['child-b', [...Array.from({ length: 10 }, (_, index) => `child-b-field-${index}`), ...Array.from({ length: 10 }, (_, index) => `child-b-method-${index}`)]],
      ]),
      relationshipsById: new Map([
        ['rel-root-a', { externalId: 'rel-root-a', kind: 'CONTAINS', fromEntityId: 'aggregate-root', toEntityId: 'child-a', label: 'contains', sourceRefs: [], metadata: {} }],
        ['rel-root-b', { externalId: 'rel-root-b', kind: 'CONTAINS', fromEntityId: 'aggregate-root', toEntityId: 'child-b', label: 'contains', sourceRefs: [], metadata: {} }],
      ]),
    } as any;

    const result = runBrowserAutoLayout({
      mode: 'flow',
      state,
      nodes: [
        { kind: 'entity', id: 'aggregate-root', x: 0, y: 0 },
        { kind: 'entity', id: 'child-a', x: 0, y: 0 },
        { kind: 'entity', id: 'child-b', x: 0, y: 0 },
      ],
      edges: [
        { relationshipId: 'rel-root-a', fromEntityId: 'aggregate-root', toEntityId: 'child-a' },
        { relationshipId: 'rel-root-b', fromEntityId: 'aggregate-root', toEntityId: 'child-b' },
      ],
      config: { cleanupIntensity: 'none' },
      options: { state },
    });

    const byId = new Map(result.nodes.map((node) => [node.id, node]));
    const rootNode = byId.get('aggregate-root')!;
    const childA = byId.get('child-a')!;
    const childB = byId.get('child-b')!;
    const rootSize = getProjectionAwareCanvasNodeSize(state, { kind: 'entity', id: 'aggregate-root' });
    const childASize = getProjectionAwareCanvasNodeSize(state, { kind: 'entity', id: 'child-a' });
    const childBSize = getProjectionAwareCanvasNodeSize(state, { kind: 'entity', id: 'child-b' });

    expect(rootNode.x + rootSize.width + 24).toBeLessThanOrEqual(Math.min(childA.x, childB.x));
    const overlaps = !(
      childA.x + childASize.width + 24 <= childB.x ||
      childB.x + childBSize.width + 24 <= childA.x ||
      childA.y + childASize.height + 24 <= childB.y ||
      childB.y + childBSize.height + 24 <= childA.y
    );
    expect(overlaps).toBe(false);
  });

  it('can soften manually placed nodes while keeping pinned nodes fixed', () => {
    const result = runBrowserAutoLayout({
      mode: 'structure',
      nodes: [
        { kind: 'entity', id: 'pinned', x: 100, y: 100, pinned: true },
        { kind: 'entity', id: 'manual', x: 500, y: 500, manuallyPlaced: true },
        { kind: 'entity', id: 'free', x: 0, y: 0 },
      ],
      edges: [
        { relationshipId: 'rel-pm', fromEntityId: 'pinned', toEntityId: 'manual' },
        { relationshipId: 'rel-mf', fromEntityId: 'manual', toEntityId: 'free' },
      ],
      config: {
        manualNodesAreHardAnchors: false,
        cleanupIntensity: 'none',
      },
    });

    const byId = new Map(result.nodes.map((node) => [node.id, node]));
    expect(byId.get('pinned')).toEqual(expect.objectContaining({ x: 100, y: 100 }));
    expect(byId.get('manual')).not.toEqual(expect.objectContaining({ x: 500, y: 500 }));
  });
});
