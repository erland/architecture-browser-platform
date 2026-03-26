import { buildBrowserProjectionModel, type BrowserProjectionCompartment, type BrowserProjectionEdge, type BrowserProjectionNode } from './browser-projection';
import { buildBrowserEdgeRoute, buildBrowserRoutingScene, type BrowserEdgeRoutingInput, type BrowserRoutingNodeFrame, type BrowserRoutingScene } from './browser-routing';
import type { BrowserSessionState } from './browserSessionStore';
import { syncMeaningfulCanvasEdges } from './browserSessionStore.canvas.relationships';

export type BrowserWorkspaceNodeModel = {
  id: string;
  kind: 'scope' | 'entity' | 'uml-class';
  badgeLabel: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  selected: boolean;
  focused: boolean;
  memberEntityIds: string[];
  compartments: BrowserProjectionCompartment[];
};

export type BrowserWorkspaceEdgePoint = {
  x: number;
  y: number;
};

export type BrowserWorkspaceEdgeRoute = {
  kind: 'straight' | 'polyline';
  points: BrowserWorkspaceEdgePoint[];
  path: string;
  labelPosition: BrowserWorkspaceEdgePoint;
};

export type BrowserWorkspaceEdgeModel = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  label: string;
  route: BrowserWorkspaceEdgeRoute;
  routingInput: BrowserEdgeRoutingInput;
  laneIndex: number;
  laneOffset: number;
  focused: boolean;
};

export type BrowserGraphWorkspaceModel = {
  routingScene: BrowserRoutingScene;
  routingRevision: string;
  width: number;
  height: number;
  nodes: BrowserWorkspaceNodeModel[];
  edges: BrowserWorkspaceEdgeModel[];
  presentationMode: 'entity-graph' | 'compact-uml';
  suppressedEntityIds: string[];
};


function buildParallelEdgeLaneOffsets(
  edges: Array<{ relationshipId: string; fromNodeId: string; toNodeId: string }>,
  options?: { enabled?: boolean; spacing?: number; maxLaneCount?: number },
): Record<string, { laneIndex: number; laneOffset: number }> {
  const spacing = options?.spacing ?? 16;
  const enabled = options?.enabled ?? true;
  const maxLaneCount = options?.maxLaneCount ?? Number.POSITIVE_INFINITY;
  const groups = new Map<string, Array<{ relationshipId: string; directionBias: number }>>();

  for (const edge of edges) {
    const key = [edge.fromNodeId, edge.toNodeId].slice().sort().join('::');
    const directionBias = edge.fromNodeId <= edge.toNodeId ? 1 : -1;
    const group = groups.get(key) ?? [];
    group.push({ relationshipId: edge.relationshipId, directionBias });
    groups.set(key, group);
  }

  const result: Record<string, { laneIndex: number; laneOffset: number }> = {};

  for (const group of groups.values()) {
    if (!enabled || group.length === 1 || group.length > maxLaneCount) {
      for (const edge of group) {
        result[edge.relationshipId] = { laneIndex: 0, laneOffset: 0 };
      }
      continue;
    }

    const ordered = group
      .slice()
      .sort((left, right) => left.directionBias - right.directionBias || left.relationshipId.localeCompare(right.relationshipId));
    const center = (ordered.length - 1) / 2;

    ordered.forEach((edge, index) => {
      const laneIndex = index - center;
      result[edge.relationshipId] = {
        laneIndex,
        laneOffset: laneIndex * spacing,
      };
    });
  }

  return result;
}


function buildRoutingRevision(
  nodes: BrowserWorkspaceNodeModel[],
  edges: BrowserWorkspaceEdgeModel[],
  routeRefreshRequestedAt: string | null,
): string {
  const nodeSignature = nodes
    .map((node) => `${node.id}:${Math.round(node.x)}:${Math.round(node.y)}:${Math.round(node.width)}:${Math.round(node.height)}`)
    .sort()
    .join('|');
  const edgeSignature = edges
    .map((edge) => `${edge.relationshipId}:${edge.fromEntityId}->${edge.toEntityId}:${edge.route.path}`)
    .sort()
    .join('|');
  return `${nodeSignature}::${edgeSignature}::${routeRefreshRequestedAt ?? 'none'}`;
}


function compareWorkspaceNodes(left: BrowserWorkspaceNodeModel, right: BrowserWorkspaceNodeModel) {
  return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
}

function compareWorkspaceEdges(left: BrowserWorkspaceEdgeModel, right: BrowserWorkspaceEdgeModel) {
  return left.relationshipId.localeCompare(right.relationshipId);
}

function buildProjectionNodeIdToWorkspaceNodeId(nodes: BrowserProjectionNode[]): Map<string, string> {
  return new Map(nodes.map((node) => [node.id, node.source.id] as const));
}

function normalizeProjectionEdgesForWorkspace(
  projectionNodes: BrowserProjectionNode[],
  edges: BrowserProjectionEdge[],
): BrowserProjectionEdge[] {
  const projectionNodeIdToWorkspaceNodeId = buildProjectionNodeIdToWorkspaceNodeId(projectionNodes);
  return edges.map((edge) => ({
    ...edge,
    fromNodeId: projectionNodeIdToWorkspaceNodeId.get(edge.fromNodeId) ?? edge.fromEntityId,
    toNodeId: projectionNodeIdToWorkspaceNodeId.get(edge.toNodeId) ?? edge.toEntityId,
  }));
}

export function buildBrowserGraphWorkspaceModel(state: BrowserSessionState): BrowserGraphWorkspaceModel {
  const effectiveCanvasEdges = syncMeaningfulCanvasEdges(state);
  const projection = buildBrowserProjectionModel({
    ...state,
    canvasEdges: effectiveCanvasEdges,
  });
  const normalizedProjectionEdges = normalizeProjectionEdgesForWorkspace(projection.nodes, projection.edges);
  const nodes = projection.nodes.map((node) => ({
    id: node.source.id,
    kind: node.kind,
    badgeLabel: node.badgeLabel,
    title: node.title,
    subtitle: node.subtitle,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    pinned: node.pinned,
    selected: node.selected,
    focused: node.focused,
    memberEntityIds: node.memberEntityIds,
    compartments: node.compartments,
  }));
  const routingNodes: BrowserRoutingNodeFrame[] = nodes.map((node) => ({
    nodeId: node.id,
    kind: node.kind,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }));
  const routingScene = buildBrowserRoutingScene(routingNodes, normalizedProjectionEdges);
  const laneOffsetsByRelationshipId = buildParallelEdgeLaneOffsets(
    normalizedProjectionEdges.map((edge) => ({
      relationshipId: edge.relationshipId,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
    })),
    {
      enabled: state.routingLayoutConfig.features.laneSeparation,
      spacing: state.routingLayoutConfig.defaults.laneSpacing,
      maxLaneCount: state.routingLayoutConfig.defaults.maxLaneCountForSpacing,
    },
  );

  const edges = normalizedProjectionEdges
    .map((edge) => {
      const routingInput = routingScene.inputsByRelationshipId[edge.relationshipId];
      if (!routingInput) {
        return null;
      }
      const lane = laneOffsetsByRelationshipId[edge.relationshipId] ?? { laneIndex: 0, laneOffset: 0 };
      const route = buildBrowserEdgeRoute(routingInput, {
        orthogonalRouting: state.routingLayoutConfig.features.orthogonalRouting,
        laneOffset: lane.laneOffset,
        laneSpacing: state.routingLayoutConfig.defaults.laneSpacing,
        gridSize: state.routingLayoutConfig.defaults.gridSize,
        obstacleMargin: state.routingLayoutConfig.defaults.obstacleMargin,
        maxChannelShiftSteps: state.routingLayoutConfig.defaults.maxChannelShiftSteps,
        endpointStubLength: state.routingLayoutConfig.defaults.endpointStubLength,
      });
      return {
        relationshipId: edge.relationshipId,
        fromEntityId: edge.fromEntityId,
        toEntityId: edge.toEntityId,
        label: edge.label,
        route,
        routingInput,
        laneIndex: lane.laneIndex,
        laneOffset: lane.laneOffset,
        focused: edge.focused,
      };
    })
    .filter((edge): edge is BrowserWorkspaceEdgeModel => Boolean(edge));

  return {
    width: projection.width,
    height: projection.height,
    presentationMode: projection.presentationPolicy.mode,
    suppressedEntityIds: projection.suppressedEntityIds,
    routingScene,
    routingRevision: buildRoutingRevision(nodes, edges, state.routeRefreshRequestedAt),
    nodes: nodes.slice().sort(compareWorkspaceNodes),
    edges: edges.slice().sort(compareWorkspaceEdges),
  };
}
