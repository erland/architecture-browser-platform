import {
  buildBalancedClusterRows,
  buildBalancedClusters,
  chooseBalancedComponentRoot,
} from '../browser-auto-layout/balancedLayoutPhases';

const node = (id: string, overrides: Record<string, unknown> = {}) => ({
  kind: 'entity',
  id,
  key: `entity:${id}`,
  x: 0,
  y: 0,
  width: 120,
  height: 84,
  pinned: false,
  manuallyPlaced: false,
  selected: false,
  focused: false,
  anchored: false,
  scopeId: null,
  inboundCount: 0,
  outboundCount: 0,
  incidentCount: 0,
  ...overrides,
});

const edge = (fromEntityId: string, toEntityId: string) => ({
  relationshipId: `${fromEntityId}-${toEntityId}`,
  fromEntityId,
  toEntityId,
  kind: null,
  label: null,
});

describe('browser balanced auto-layout phases', () => {
  test('balanced root phase prefers the selected node when present', () => {
    const nodes = [
      node('a', { outboundCount: 1, incidentCount: 1 }),
      node('b', { inboundCount: 1, incidentCount: 1, selected: true }),
    ];
    const graph = {
      focusedNodeId: null,
      selectedNodeIds: ['b'],
    } as any;

    expect(chooseBalancedComponentRoot(nodes as any, [edge('a', 'b')] as any, graph)?.id).toBe('b');
  });

  test('balanced clustering phase keeps low-degree leaf neighbors as sidecars', () => {
    const nodes = [
      node('anchor', { outboundCount: 2, incidentCount: 2 }),
      node('leaf-a', { inboundCount: 1, incidentCount: 1 }),
      node('leaf-b', { inboundCount: 1, incidentCount: 1 }),
      node('hub', { inboundCount: 1, outboundCount: 3, incidentCount: 4 }),
    ];

    const clusters = buildBalancedClusters(
      nodes as any,
      [edge('anchor', 'leaf-a'), edge('anchor', 'leaf-b'), edge('hub', 'anchor')] as any,
      nodes[0] as any,
    );

    const anchorCluster = clusters.find((cluster) => cluster.anchor.id === 'anchor');

    expect(anchorCluster?.anchor.id).toBe('anchor');
    expect(anchorCluster?.sidecars.map((current) => current.id)).toEqual(['leaf-a', 'leaf-b']);
  });

  test('balanced row phase wraps clusters when the row width limit is exceeded', () => {
    const rows = buildBalancedClusterRows(
      [
        { anchor: node('a') as any, sidecars: [], members: [], width: 300, height: 100, outboundToUnassigned: 0 },
        { anchor: node('b') as any, sidecars: [], members: [], width: 300, height: 120, outboundToUnassigned: 0 },
        { anchor: node('c') as any, sidecars: [], members: [], width: 300, height: 110, outboundToUnassigned: 0 },
      ] as any,
      750,
      80,
    );

    expect(rows.map((row) => row.clusters.map((cluster) => cluster.anchor.id))).toEqual([
      ['a', 'b'],
      ['c'],
    ]);
  });
});
