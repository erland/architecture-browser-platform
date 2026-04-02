import { buildBrowserSnapshotIndex, buildViewpointGraph, getAvailableViewpoints } from '../../browser-snapshot';
import { buildBrowserFactsPanelModel } from '../../components/browser-facts-panel/BrowserFactsPanel';
import { applySelectedViewpoint, createEmptyBrowserSessionState, openSnapshotSession, selectBrowserScope, setSelectedViewpoint } from '../../browser-session';
import { createCuratedViewpointsPayload, curatedViewpointIds } from './fixtures/viewpointFixtures';

const expectedByViewpoint: Record<string, { recommendedLayout: string; seedEntityIds: string[]; relationshipIds: string[] }> = {
  'request-handling': {
    recommendedLayout: 'request-flow',
    seedEntityIds: ['entity:endpoint:orders', 'entity:service:orders'],
    relationshipIds: ['rel:req:service', 'rel:service:repo', 'rel:repo:model'],
  },
  'api-surface': {
    recommendedLayout: 'api-surface',
    seedEntityIds: ['entity:endpoint:orders'],
    relationshipIds: ['rel:req:service'],
  },
  'persistence-model': {
    recommendedLayout: 'persistence-model',
    seedEntityIds: ['entity:repo:orders', 'entity:model:order'],
    relationshipIds: ['rel:service:repo', 'rel:repo:model', 'rel:model:store'],
  },
  'integration-map': {
    recommendedLayout: 'integration-map',
    seedEntityIds: ['entity:adapter:payments'],
    relationshipIds: ['rel:service:adapter', 'rel:adapter:external'],
  },
  'module-dependencies': {
    recommendedLayout: 'module-dependencies',
    seedEntityIds: ['entity:module:api', 'entity:module:web'],
    relationshipIds: ['rel:module:web-api'],
  },
  'ui-navigation': {
    recommendedLayout: 'ui-navigation',
    seedEntityIds: ['entity:layout:app-shell', 'entity:page:orders'],
    relationshipIds: ['rel:layout:page', 'rel:layout:guard', 'rel:page:self-nav'],
  },
};

describe('Browser viewpoints curated regression coverage', () => {
  test('indexes all curated available viewpoints from the export payload', () => {
    const index = buildBrowserSnapshotIndex(createCuratedViewpointsPayload());
    expect(getAvailableViewpoints(index).map((viewpoint) => viewpoint.id)).toEqual([...curatedViewpointIds].sort());
  });

  test.each([...curatedViewpointIds] as string[])('builds a stable graph for %s', (viewpointId) => {
    const index = buildBrowserSnapshotIndex(createCuratedViewpointsPayload());
    const viewpoint = index.viewpointsById.get(viewpointId);
    expect(viewpoint).toBeDefined();
    const graph = buildViewpointGraph(index, viewpoint!, { scopeMode: 'whole-snapshot', selectedScopeId: 'scope:repo' });

    expect(graph.recommendedLayout).toBe(expectedByViewpoint[viewpointId].recommendedLayout);
    expect(graph.seedEntityIds).toEqual(expectedByViewpoint[viewpointId].seedEntityIds);
    expect(graph.relationshipIds).toEqual(expectedByViewpoint[viewpointId].relationshipIds);
    expect(graph.entityIds.length).toBeGreaterThanOrEqual(graph.seedEntityIds.length);
  });


  test('builds a scoped graph when a viewpoint is applied from a nested selected scope', () => {
    const payload = createCuratedViewpointsPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-curated', repositoryId: 'repo-curated', payload });
    state = selectBrowserScope(state, 'scope:module:web');
    state = setSelectedViewpoint(state, 'ui-navigation');
    state = applySelectedViewpoint(state);

    expect(state.appliedViewpoint?.viewpoint.id).toBe('ui-navigation');
    expect(state.appliedViewpoint?.scopeMode).toBeDefined();
    expect(state.canvasNodes.some((node: { id: string }) => node.id === 'entity:page:orders')).toBe(true);
    expect(state.appliedViewpoint?.entityIds.length).toBeGreaterThan(0);
  });

  test.each([...curatedViewpointIds] as string[])('applies %s and exposes viewpoint explanation in the facts panel', (viewpointId) => {
    const payload = createCuratedViewpointsPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-curated', repositoryId: 'repo-curated', payload });
    state = selectBrowserScope(state, 'scope:repo');
    state = setSelectedViewpoint(state, viewpointId);
    state = applySelectedViewpoint(state);

    expect(state.appliedViewpoint?.viewpoint.id).toBe(viewpointId);
    expect(state.appliedViewpoint?.entityIds.length).toBeGreaterThan(0);
    expect(state.canvasNodes.filter((node: { kind: string }) => node.kind === 'entity').length).toBeGreaterThan(0);

    const factsModel = buildBrowserFactsPanelModel(state);
    expect(factsModel?.viewpointExplanation?.viewpointId).toBe(viewpointId);
    expect(factsModel?.viewpointExplanation?.recommendedLayout).toBe(expectedByViewpoint[viewpointId].recommendedLayout);
    expect(factsModel?.viewpointExplanation?.entityCount).toBe(state.appliedViewpoint?.entityIds.length);
  });
});
