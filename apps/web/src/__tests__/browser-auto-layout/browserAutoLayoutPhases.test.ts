import { buildFlowBands } from '../../browser-auto-layout/flowLayoutPhases';
import { buildHierarchyForest } from '../../browser-auto-layout/hierarchyLayoutPhases';
import { chooseStructureComponentRoot } from '../../browser-auto-layout/structureLayoutPhases';

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

describe('browser auto-layout named phases', () => {
  test('structure root phase prefers the focused node when present', () => {
    const nodes = [
      node('a', { outboundCount: 1, incidentCount: 1 }),
      node('b', { inboundCount: 1, incidentCount: 1, focused: true }),
    ];
    const graph = {
      focusedNodeId: 'b',
      selectedNodeIds: [],
    } as any;

    expect(chooseStructureComponentRoot(nodes as any, [edge('a', 'b')] as any, graph)?.id).toBe('b');
  });

  test('flow banding phase keeps a simple directed chain in ascending levels', () => {
    const nodes = [
      node('a', { outboundCount: 1, incidentCount: 1 }),
      node('b', { inboundCount: 1, outboundCount: 1, incidentCount: 2 }),
      node('c', { inboundCount: 1, incidentCount: 1 }),
    ];
    const bands = buildFlowBands(nodes as any, [edge('a', 'b'), edge('b', 'c')] as any, {
      focusedNodeId: null,
      selectedNodeIds: [],
    } as any);

    expect(bands.map((band) => ({ level: band.level, ids: band.nodes.map((current) => current.id) }))).toEqual([
      { level: 0, ids: ['a'] },
      { level: 1, ids: ['b'] },
      { level: 2, ids: ['c'] },
    ]);
  });

  test('hierarchy forest phase identifies the parent as the root for a simple tree', () => {
    const nodes = [
      node('parent', { outboundCount: 2, incidentCount: 2 }),
      node('child-a', { inboundCount: 1, incidentCount: 1 }),
      node('child-b', { inboundCount: 1, incidentCount: 1 }),
    ];
    const forest = buildHierarchyForest(
      nodes as any,
      [edge('parent', 'child-a'), edge('parent', 'child-b')] as any,
      {
        focusedNodeId: null,
        selectedNodeIds: [],
      } as any,
      {
        nodes: [],
        edges: [],
        mode: 'hierarchy',
        options: undefined,
      } as any,
    );

    expect(forest.rootIds).toEqual(['parent']);
    expect(forest.childrenByNode.get('parent')).toEqual(['child-a', 'child-b']);
  });
});
