import type { BrowserCanvasNode } from '../../../browser-graph/contracts';
import type { BrowserAutoLayoutNode } from '../../core/types';
import type { BrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import { compareNodePriority } from '../../shared/ordering';
import {
  assignNodesToAnchors,
  buildFallbackFreeNodeOrigin,
  enforceAnchoredPlacementClearance,
  finalizeComponentPlacement,
  prepareAnchoredComponentPlacement,
} from '../../shared/layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from '../../shared/layoutFreePlacement';
import { buildCenteredVerticalTopPositions } from '../../shared/layoutFootprint';
import { assignSignedLevelsFromAnchor } from '../../shared/layoutSignedLevels';

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
