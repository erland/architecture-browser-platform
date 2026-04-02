import type { FullSnapshotViewpoint } from '../../app-model';
import {
  arrangeCanvasNodesAroundEntityFocus,
  arrangeCanvasNodesInGrid,
} from '../../browser-canvas-placement';
import {
  type BrowserResolvedViewpointGraph,
  buildViewpointGraph,
  type BrowserViewpointScopeMode,
} from '../../browser-snapshot';
import type {
  BrowserCanvasEdge,
  BrowserCanvasNode,
  BrowserSessionState,
  BrowserViewpointSelection,
} from '../browserSessionStore.types';

export function resolveViewpointScopeId(state: BrowserSessionState, scopeMode: BrowserViewpointScopeMode) {
  if (scopeMode === 'whole-snapshot') {
    return null;
  }
  return state.selectedScopeId;
}

export function buildAppliedViewpointGraph(state: BrowserSessionState, viewpoint: FullSnapshotViewpoint, selection: BrowserViewpointSelection) {
  if (!state.index) {
    return null;
  }
  return buildViewpointGraph(state.index, viewpoint, {
    scopeMode: selection.scopeMode,
    selectedScopeId: resolveViewpointScopeId(state, selection.scopeMode),
    variant: selection.variant,
  });
}

export function buildAppliedViewpointGraphWithFallback(state: BrowserSessionState, viewpoint: FullSnapshotViewpoint, selection: BrowserViewpointSelection) {
  const primary = buildAppliedViewpointGraph(state, viewpoint, selection);
  if (primary && primary.entityIds.length > 0) {
    return primary;
  }
  if (!state.index) {
    return primary;
  }

  let subtreeFallback: BrowserResolvedViewpointGraph | null = null;
  if (selection.scopeMode === 'selected-scope' && state.selectedScopeId) {
    subtreeFallback = buildViewpointGraph(state.index, viewpoint, {
      scopeMode: 'selected-subtree',
      selectedScopeId: state.selectedScopeId,
      variant: selection.variant,
    });
    if (subtreeFallback.entityIds.length > 0) {
      return subtreeFallback;
    }
  }

  const wholeSnapshotFallback = buildViewpointGraph(state.index, viewpoint, {
    scopeMode: 'whole-snapshot',
    selectedScopeId: null,
    variant: selection.variant,
  });
  if (wholeSnapshotFallback.entityIds.length > 0) {
    return wholeSnapshotFallback;
  }
  return subtreeFallback ?? primary;
}

export function arrangeViewpointCanvasNodes(
  state: BrowserSessionState,
  nodes: BrowserCanvasNode[],
  edges: BrowserCanvasEdge[],
  graph: BrowserResolvedViewpointGraph,
) {
  if (nodes.length === 0) {
    return nodes;
  }
  if ((graph.recommendedLayout === 'request-flow' || graph.recommendedLayout === 'api-surface' || graph.recommendedLayout === 'persistence-model' || graph.recommendedLayout === 'integration-map' || graph.recommendedLayout === 'module-dependencies' || graph.recommendedLayout === 'ui-navigation') && state.index) {
    const laneX = graph.recommendedLayout === 'api-surface'
      ? [120, 460, 800, 1140]
      : graph.recommendedLayout === 'persistence-model'
        ? [120, 460, 800, 1140]
        : graph.recommendedLayout === 'integration-map'
          ? [120, 500, 880, 1260]
          : graph.recommendedLayout === 'module-dependencies'
            ? [120, 520, 920]
            : graph.recommendedLayout === 'ui-navigation'
              ? [120, 460, 820, 1180]
              : [120, 420, 720, 1020, 1320];
    const laneCounts = graph.recommendedLayout === 'api-surface' || graph.recommendedLayout === 'persistence-model' || graph.recommendedLayout === 'integration-map' || graph.recommendedLayout === 'ui-navigation' ? [0, 0, 0, 0] : graph.recommendedLayout === 'module-dependencies' ? [0, 0, 0] : [0, 0, 0, 0, 0];
    const graphEntityIds = new Set(graph.entityIds);
    const arranged = nodes.map((node, nodeIndex) => {
      if (node.kind !== 'entity' || !graphEntityIds.has(node.id)) {
        if (node.kind === 'scope') {
          return { ...node, x: 40, y: 40 + nodeIndex * 96 };
        }
        return node;
      }
      const entity = state.index?.entitiesById.get(node.id);
      const roles = entity
        ? (() => {
            const entityWithTopLevelRoles = entity as typeof entity & { architecturalRoles?: unknown };
            const rawRoles = Array.isArray(entityWithTopLevelRoles.architecturalRoles)
              ? entityWithTopLevelRoles.architecturalRoles
              : entity.metadata?.architecturalRoles;
            return Array.isArray(rawRoles)
              ? rawRoles.filter((value: unknown): value is string => typeof value === 'string')
              : [];
          })()
        : [];
      const lane = graph.recommendedLayout === 'api-surface'
        ? (roles.includes('api-entrypoint')
            ? 0
            : roles.includes('application-service')
              ? 1
              : roles.includes('integration-adapter') || roles.includes('external-dependency')
                ? 2
                : 3)
        : graph.recommendedLayout === 'persistence-model'
          ? (roles.includes('api-entrypoint') || roles.includes('application-service')
              ? 0
              : roles.includes('persistence-access')
                ? 1
                : roles.includes('persistent-entity')
                  ? 2
                  : 3)
          : graph.recommendedLayout === 'integration-map'
            ? (roles.includes('api-entrypoint') || roles.includes('application-service')
                ? 0
                : roles.includes('integration-adapter')
                  ? 1
                  : roles.includes('external-dependency')
                    ? 2
                    : 3)
            : graph.recommendedLayout === 'module-dependencies'
              ? (roles.includes('module-boundary')
                  ? (() => {
                      const outbound = edges.some((edge) => edge.fromEntityId === node.id && graph.entityIds.includes(edge.toEntityId));
                      const inbound = edges.some((edge) => edge.toEntityId === node.id && graph.entityIds.includes(edge.fromEntityId));
                      if (outbound && !inbound) {
                        return 0;
                      }
                      if (inbound && !outbound) {
                        return 1;
                      }
                      return graph.seedEntityIds.includes(node.id) ? 0 : 1;
                    })()
                  : 2)
            : graph.recommendedLayout === 'ui-navigation'
              ? (roles.includes('ui-layout')
                  ? 0
                  : roles.includes('ui-page')
                    ? 1
                    : roles.includes('ui-navigation-node')
                      ? 2
                      : 3)
            : (roles.includes('api-entrypoint')
                ? 0
                : roles.includes('application-service')
                  ? 1
                  : roles.includes('persistence-access') || roles.includes('persistent-entity')
                    ? 2
                    : roles.includes('integration-adapter') || roles.includes('external-dependency')
                      ? 3
                      : 4);
      const laneIndex = laneCounts[lane]++;
      return {
        ...node,
        x: laneX[lane],
        y: 120 + laneIndex * 132,
        pinned: graph.seedEntityIds.includes(node.id) || node.pinned,
      };
    });
    return arranged;
  }
  if (graph.seedEntityIds.length > 0) {
    return arrangeCanvasNodesAroundEntityFocus(nodes, edges, graph.seedEntityIds[0], { state });
  }
  return arrangeCanvasNodesInGrid(nodes, { state });
}
