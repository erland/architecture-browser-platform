import { buildBrowserEdgeRoute, buildBrowserRoutingScene, type BrowserRoutingNodeFrame } from '../../browser-routing';
import type { BrowserSessionState } from '../../browser-session';
import type { BrowserProjectionEdge } from '../../browser-projection';
import type {
  BrowserGraphWorkspaceModel,
  BrowserWorkspaceEdgeModel,
  BrowserWorkspaceNodeModel,
} from './browserGraphWorkspaceModel';

export function buildParallelEdgeLaneOffsets(
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

export function compareWorkspaceEdges(left: BrowserWorkspaceEdgeModel, right: BrowserWorkspaceEdgeModel) {
  return left.relationshipId.localeCompare(right.relationshipId);
}

export function buildWorkspaceRouting(
  state: BrowserSessionState,
  nodes: BrowserWorkspaceNodeModel[],
  normalizedProjectionEdges: BrowserProjectionEdge[],
): Pick<BrowserGraphWorkspaceModel, 'routingScene' | 'routingRevision' | 'edges'> {
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

  const edges: BrowserWorkspaceEdgeModel[] = [];
  for (const edge of normalizedProjectionEdges) {
    const routingInput = routingScene.inputsByRelationshipId[edge.relationshipId];
    if (!routingInput) {
      continue;
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
    edges.push({
      relationshipId: edge.relationshipId,
      fromEntityId: edge.fromEntityId,
      toEntityId: edge.toEntityId,
      label: edge.label,
      fromLabel: edge.fromLabel,
      toLabel: edge.toLabel,
      semanticStyle: edge.semanticStyle,
      route,
      routingInput,
      laneIndex: lane.laneIndex,
      laneOffset: lane.laneOffset,
      focused: edge.focused,
    });
  }


  return {
    routingScene,
    routingRevision: buildRoutingRevision(nodes, edges, state.routeRefreshRequestedAt),
    edges,
  };
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
