import type { BrowserCanvasNode } from '../../../browser-session';
import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import type { BrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import { buildUndirectedAdjacency, compareNodePriority, sortBandNodesByBarycenter } from '../../shared/ordering';
import { getBrowserAutoLayoutConfig } from '../../core/config';
import {
  assignNodesToAnchors,
  buildFallbackFreeNodeOrigin,
  enforceAnchoredPlacementClearance,
  finalizeComponentPlacement,
  prepareAnchoredComponentPlacement,
} from '../../shared/layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from '../../shared/layoutFreePlacement';
import {
  buildDirectedAdjacency,
} from '../../shared/layoutShared';
import { choosePriorityRoots } from '../../shared/layoutRoots';
import {
  fillMissingLevels,
  groupNodesByLevel,
  normalizeLevelsToNonNegative,
  propagateLongestDirectedLevels,
  relaxDirectedLevels,
  seedLevelsFromRoots,
  seedLevelsFromZeroIndegreeRoots,
} from '../../shared/layoutLevels';
import { buildCenteredVerticalTopPositions, buildSequentialBandLeftPositions } from '../../shared/layoutFootprint';
import { assignSignedLevelsFromAnchor } from '../../shared/layoutSignedLevels';
import { createBrowserAutoLayoutComponentOrigin } from '../../shared/componentModel';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';

export function chooseFlowRoots(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const { indegree } = buildDirectedAdjacency(componentNodes, edges);
  return choosePriorityRoots(componentNodes, { graph, indegree });
}

export function assignFlowLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
): Map<string, number> {
  const { outbound, inbound, indegree } = buildDirectedAdjacency(componentNodes, edges);
  const roots = chooseFlowRoots(componentNodes, edges, graph);
  const levels = new Map<string, number>();
  const queue: string[] = [];
  const sortedNodeIds = componentNodes.map((node) => node.id).sort();

  seedLevelsFromRoots(roots, levels, queue);
  seedLevelsFromZeroIndegreeRoots(componentNodes, indegree, levels, queue);
  propagateLongestDirectedLevels(outbound, levels, queue);
  relaxDirectedLevels(sortedNodeIds, { outbound, inbound, indegree }, levels, componentNodes.length);
  fillMissingLevels(componentNodes, levels);
  normalizeLevelsToNonNegative(levels);

  return levels;
}

export function buildFlowBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const levels = assignFlowLevels(componentNodes, edges, graph);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const grouped = groupNodesByLevel(componentNodes, levels);

  const fixedOrder = new Map<string, number>();
  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, nodes]) => {
      const orderedNodes = level === 0
        ? [...nodes].sort((left, right) => compareNodePriority(left, right))
        : sortBandNodesByBarycenter(nodes, adjacency, fixedOrder, compareNodePriority);
      orderedNodes.forEach((node, index) => fixedOrder.set(node.id, index));
      return { level, nodes: orderedNodes };
    });
}

export function placeFlowAnchoredComponentNodes(
  componentModel: BrowserAutoLayoutComponentModel,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request, graph } = context;
  const prepared = prepareAnchoredComponentPlacement(componentModel.component, request, graph, nodeById, canvasNodeByKey, arranged);
  if (!prepared) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const { componentNodes, componentEdges, anchorNodes } = prepared;
  let nextArranged = prepared.arrangedWithAnchors;
  const assignments = assignNodesToAnchors(componentNodes, componentEdges, anchorNodes);
  const freeNodes = componentNodes.filter((node) => !node.pinned && !node.manuallyPlaced);

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }
    const assignedNodes = freeNodes
      .filter((node) => assignments.get(node.id)?.anchorId === anchorNode.id)
      .sort(compareNodePriority);

    const assignedNodeIds = new Set([anchorNode.id, ...assignedNodes.map((node) => node.id)]);
    const signedLevels = assignSignedLevelsFromAnchor(
      [anchorNode, ...assignedNodes],
      componentEdges.filter((edge) => assignedNodeIds.has(edge.fromEntityId) && assignedNodeIds.has(edge.toEntityId)),
      anchorNode.id,
    );

    const grouped = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const signedLevel = signedLevels.get(node.id) ?? (assignments.get(node.id)?.distance ?? 1);
      grouped.set(signedLevel, [...(grouped.get(signedLevel) ?? []), node]);
    }

    const bands = [...grouped.entries()].sort((left, right) => left[0] - right[0]).map(([level, nodes]) => ({
      level,
      nodes: [...nodes].sort(compareNodePriority),
    }));
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      bands,
      ({ band, index, config }) => {
        const topPositions = buildCenteredVerticalTopPositions(
          band.nodes,
          anchorCanvasNode.y + anchorNode.height / 2,
          config,
        );
        return {
          x: anchorCanvasNode.x + band.level * config.horizontalSpacing,
          y: topPositions[index] ?? anchorCanvasNode.y,
        };
      },
    );
  }

  const unassignedNodes = freeNodes
    .filter((node) => !assignments.has(node.id))
    .sort(compareNodePriority);
  if (unassignedNodes.length > 0) {
    const fallbackOrigin = buildFallbackFreeNodeOrigin(nextArranged, fallbackOriginY);
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      [{ level: 0, nodes: unassignedNodes }],
      ({ band, index, config }) => {
        const topPositions = buildCenteredVerticalTopPositions(band.nodes, fallbackOrigin.y, config);
        return {
          x: fallbackOrigin.x,
          y: topPositions[index] ?? fallbackOrigin.y,
        };
      },
    );
  }

  nextArranged = enforceAnchoredPlacementClearance(nextArranged, freeNodes.map((node) => node.id), request);

  return finalizeComponentPlacement(componentModel.component, request, nextArranged, fallbackOriginY);
}

export function placeFlowFreeComponentNodes(
  componentModel: BrowserAutoLayoutComponentModel,
  context: BrowserAutoLayoutPipelineContext,
  _nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request } = context;
  const config = getBrowserAutoLayoutConfig(request);
  const { entityNodes: componentNodes, edges: componentEdges } = componentModel;
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = createBrowserAutoLayoutComponentOrigin(arranged, fallbackOriginY);

  const bands = buildFlowBands(componentNodes, componentEdges, context.graph);
  const bandLeftByLevel = buildSequentialBandLeftPositions(bands, componentOrigin.x, config);
  const nextArranged = placeBandBasedFreeComponentNodes(
    arranged,
    request,
    canvasNodeByKey,
    bands,
    ({ band, index, config }) => {
      const topPositions = buildCenteredVerticalTopPositions(band.nodes, componentOrigin.y, config);
      return {
        x: bandLeftByLevel.get(band.level) ?? componentOrigin.x,
        y: topPositions[index] ?? componentOrigin.y,
      };
    },
  );

  return finalizeComponentPlacement(componentModel.component, request, nextArranged, fallbackOriginY);
}

