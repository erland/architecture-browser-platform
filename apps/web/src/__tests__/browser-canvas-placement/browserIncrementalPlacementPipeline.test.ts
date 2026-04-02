import { planEntityInsertion } from '../../browser-canvas-placement';
import { createEmptyBrowserSessionState } from '../../browser-session';

describe('browser incremental placement pipeline', () => {
  it('uses the graph-aware pipeline to place a newly added entity between related visible neighbors', () => {
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

  it('falls back to scope-aware placement when no graph-visible relationship exists', () => {
    const state = createEmptyBrowserSessionState();
    state.index = {
      ...state.index,
      entitiesById: new Map([
        ['scope-a-new', { externalId: 'scope-a-new', kind: 'SERVICE', origin: null, name: 'New', displayName: 'New', scopeId: 'scope-a', sourceRefs: [], metadata: {} }],
      ]),
      relationshipsById: new Map(),
    } as any;
    state.canvasNodes = [
      { kind: 'scope', id: 'scope-a', x: 80, y: 80 },
    ];

    const placement = planEntityInsertion(
      state.canvasNodes,
      state.index!,
      state.index!.entitiesById.get('scope-a-new')!,
      undefined,
      { state },
    );

    expect(placement.x).toBeGreaterThan(state.canvasNodes[0].x);
    expect(placement.y).toBeGreaterThan(state.canvasNodes[0].y);
  });

  it('keeps explicit anchor directions ahead of graph-aware placement', () => {
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
    state.canvasNodes = [{ kind: 'entity', id: 'anchor', x: 500, y: 300 }];

    const placement = planEntityInsertion(
      state.canvasNodes,
      state.index!,
      state.index!.entitiesById.get('incoming')!,
      { anchorEntityId: 'anchor', anchorDirection: 'left' },
      { state },
    );

    expect(placement.x).toBeLessThan(state.canvasNodes[0].x);
  });
});
