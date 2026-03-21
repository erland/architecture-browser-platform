import {
  arrangeCanvasNodesAroundEntityFocus,
  arrangeCanvasNodesInGrid,
  getDefaultCanvasNodePosition,
  planEntityInsertion,
  planScopeInsertion,
} from './browserCanvasPlacement';
import type { FullSnapshotViewpoint } from './appModel';
import {
  type BrowserResolvedViewpointGraph,
  type BrowserSnapshotIndex,
  type BrowserViewpointScopeMode,
  buildViewpointGraph,
  searchBrowserSnapshotIndex,
} from './browserSnapshotIndex';
import type {
  BrowserCanvasEdge,
  BrowserCanvasNode,
  BrowserCanvasViewport,
  BrowserSessionState,
  BrowserViewpointSelection,
} from './browserSessionStore.types';

export function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function isFiniteCoordinate(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function createPositionedCanvasNode(
  nextNode: Omit<BrowserCanvasNode, 'x' | 'y'> & Partial<Pick<BrowserCanvasNode, 'x' | 'y'>>,
  fallbackPosition?: { x: number; y: number },
) {
  if (isFiniteCoordinate(nextNode.x) && isFiniteCoordinate(nextNode.y)) {
    return {
      ...nextNode,
      x: nextNode.x,
      y: nextNode.y,
    } satisfies BrowserCanvasNode;
  }
  return {
    ...nextNode,
    x: fallbackPosition?.x ?? 56,
    y: fallbackPosition?.y ?? 64,
  } satisfies BrowserCanvasNode;
}

export function upsertCanvasNode(
  nodes: BrowserCanvasNode[],
  nextNode: Omit<BrowserCanvasNode, 'x' | 'y'> & Partial<Pick<BrowserCanvasNode, 'x' | 'y'>>,
  fallbackPosition?: { x: number; y: number },
) {
  const existingIndex = nodes.findIndex((node) => node.kind === nextNode.kind && node.id === nextNode.id);
  if (existingIndex === -1) {
    return [...nodes, createPositionedCanvasNode(nextNode, fallbackPosition)];
  }
  const updated = [...nodes];
  const existingNode = updated[existingIndex];
  const nextPositionedNode = createPositionedCanvasNode({
    ...existingNode,
    ...nextNode,
    x: nextNode.x ?? existingNode.x,
    y: nextNode.y ?? existingNode.y,
  }, fallbackPosition);
  updated[existingIndex] = {
    ...existingNode,
    ...nextPositionedNode,
    pinned: nextNode.pinned ?? existingNode.pinned,
    manuallyPlaced: nextNode.manuallyPlaced ?? existingNode.manuallyPlaced,
  };
  return updated;
}

export function normalizeCanvasNodes(nodes: BrowserCanvasNode[]) {
  let normalized: BrowserCanvasNode[] = [];
  for (const node of nodes) {
    normalized = upsertCanvasNode(normalized, node, getDefaultCanvasNodePosition(node.kind, normalized));
  }
  return normalized;
}

export function upsertCanvasEdge(edges: BrowserCanvasEdge[], nextEdge: BrowserCanvasEdge) {
  const existing = edges.find((edge) => edge.relationshipId === nextEdge.relationshipId);
  return existing ? edges : [...edges, nextEdge];
}

export function upsertSelectedEntityIds(selectedEntityIds: string[], entityId: string, additive: boolean) {
  if (additive) {
    return selectedEntityIds.includes(entityId)
      ? selectedEntityIds.filter((current) => current !== entityId)
      : [...selectedEntityIds, entityId];
  }
  return [entityId];
}

export function upsertPinnedCanvasNode(nodes: BrowserCanvasNode[], kind: BrowserCanvasNode['kind'], id: string, pinned: boolean) {
  const existing = nodes.find((node) => node.kind === kind && node.id === id);
  if (!existing && !pinned) {
    return nodes;
  }
  if (!existing) {
    return upsertCanvasNode(nodes, { kind, id, pinned });
  }
  return nodes.map((node) => node.kind === kind && node.id === id ? { ...node, pinned } : node);
}

export function computeSearchResults(index: BrowserSnapshotIndex | null, query: string, scopeId: string | null) {
  if (!index || !query.trim()) {
    return [];
  }
  return searchBrowserSnapshotIndex(index, query, { scopeId, limit: 50 });
}

export function planEntityNodePosition(
  state: BrowserSessionState,
  entityId: string,
  options?: {
    anchorEntityId?: string | null;
    anchorDirection?: 'around' | 'left' | 'right';
    insertionIndex?: number;
    insertionCount?: number;
  },
) {
  const entity = state.index?.entitiesById.get(entityId);
  if (!state.index || !entity) {
    return getDefaultCanvasNodePosition('entity', state.canvasNodes, { state });
  }
  return planEntityInsertion(state.canvasNodes, state.index, entity, {
    anchorEntityId: options?.anchorEntityId ?? (state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null),
    anchorDirection: options?.anchorDirection,
    selectedScopeId: state.selectedScopeId,
    insertionIndex: options?.insertionIndex,
    insertionCount: options?.insertionCount,
  }, { state });
}

export function planScopeNodePosition(state: BrowserSessionState, scopeId: string, insertionIndex = 0) {
  return planScopeInsertion(state.canvasNodes, scopeId, insertionIndex);
}

export function createCanvasEdgesForRelationshipIds(index: BrowserSnapshotIndex, relationshipIds: string[]) {
  return relationshipIds
    .map((relationshipId) => index.relationshipsById.get(relationshipId))
    .filter((relationship): relationship is NonNullable<typeof relationship> => Boolean(relationship))
    .map((relationship) => ({
      relationshipId: relationship.externalId,
      fromEntityId: relationship.fromEntityId,
      toEntityId: relationship.toEntityId,
    }));
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
    return nodes.map((node, nodeIndex) => {
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
  }
  if (graph.seedEntityIds.length > 0) {
    return arrangeCanvasNodesAroundEntityFocus(nodes, edges, graph.seedEntityIds[0], { state });
  }
  return arrangeCanvasNodesInGrid(nodes, { state });
}

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

export function clampCanvasZoom(zoom: number) {
  return Math.min(2.2, Math.max(0.35, Number.isFinite(zoom) ? zoom : 1));
}

export function mergeCanvasViewport(current: BrowserCanvasViewport, viewport: Partial<BrowserCanvasViewport>): BrowserCanvasViewport {
  return {
    zoom: clampCanvasZoom(viewport.zoom ?? current.zoom),
    offsetX: viewport.offsetX ?? current.offsetX,
    offsetY: viewport.offsetY ?? current.offsetY,
  };
}
