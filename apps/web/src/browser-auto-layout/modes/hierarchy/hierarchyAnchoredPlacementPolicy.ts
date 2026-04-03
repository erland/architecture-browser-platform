import { getBrowserCanvasBounds } from '../../../browser-canvas-placement/collision';
import type { BrowserCanvasNode } from '../../../browser-session';
import type { BrowserAutoLayoutNode } from '../../core/types';
import type { BrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import { compareNodePriority } from '../../shared/ordering';
import {
  buildFallbackFreeNodeOrigin,
  enforceAnchoredPlacementClearance,
  prepareAnchoredComponentPlacement,
} from '../../shared/layoutAnchoredPlacement';
import { assignSignedLevelsFromAnchor } from '../../shared/layoutSignedLevels';
import { buildCenteredHorizontalLeftPositions } from '../../shared/layoutFootprint';
import { placeBrowserAutoLayoutNode } from '../../shared/placement';

export function placeAnchoredHierarchyComponentNodes(
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

  const { config, componentNodes, componentEdges, anchorNodes } = prepared;
  let nextArranged = prepared.arrangedWithAnchors;
  const freeNodes = componentNodes.filter((node) => !node.pinned && !node.manuallyPlaced);
  const bounds = getBrowserCanvasBounds(nextArranged);
  let componentBottom = Math.max(fallbackOriginY, bounds?.maxY ?? fallbackOriginY);

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }

    const signedLevels = assignSignedLevelsFromAnchor(componentNodes, componentEdges, anchorNode.id);
    const assignedNodes = freeNodes
      .filter((node) => signedLevels.has(node.id))
      .sort(compareNodePriority);
    const grouped = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const signedLevel = signedLevels.get(node.id);
      if (signedLevel === undefined || signedLevel === 0) {
        continue;
      }
      grouped.set(signedLevel, [...(grouped.get(signedLevel) ?? []), node]);
    }

    const orderedGroups = [...grouped.entries()].sort((left, right) => left[0] - right[0]);
    const levelTopBySignedLevel = new Map<number, number>();
    const negativeGroups = orderedGroups
      .filter(([level]) => level < 0)
      .sort((left, right) => right[0] - left[0]);
    const positiveGroups = orderedGroups
      .filter(([level]) => level > 0)
      .sort((left, right) => left[0] - right[0]);
    const gapY = Math.max(24, config.verticalSpacing - 84);
    let upwardCursor = anchorCanvasNode.y - Math.max(24, Math.round(config.componentSpacing / 3));
    for (const [level, nodes] of negativeGroups) {
      const maxHeight = Math.max(84, ...nodes.map((node) => node.height));
      const top = nodes.some((node) => node.height > 84)
        ? upwardCursor - maxHeight
        : anchorCanvasNode.y + level * config.verticalSpacing;
      levelTopBySignedLevel.set(level, Math.round(top));
      upwardCursor = Math.min(upwardCursor, top) - gapY;
    }
    let downwardCursor = anchorCanvasNode.y + anchorNode.height + Math.max(24, Math.round(config.componentSpacing / 3));
    for (const [level, nodes] of positiveGroups) {
      const maxHeight = Math.max(84, ...nodes.map((node) => node.height));
      const top = nodes.some((node) => node.height > 84)
        ? downwardCursor
        : anchorCanvasNode.y + level * config.verticalSpacing;
      levelTopBySignedLevel.set(level, Math.round(top));
      downwardCursor = Math.max(downwardCursor, top + maxHeight + gapY);
    }

    for (const [signedLevel, bandNodes] of orderedGroups) {
      const orderedBandNodes = [...bandNodes].sort(compareNodePriority);
      const xPositions = buildCenteredHorizontalLeftPositions(
        orderedBandNodes,
        anchorCanvasNode.x + anchorNode.width / 2,
        config,
      );
      for (const [index, layoutNode] of orderedBandNodes.entries()) {
        const original = canvasNodeByKey.get(layoutNode.key);
        if (!original) {
          continue;
        }
        const desired = {
          x: xPositions[index] ?? anchorCanvasNode.x,
          y: levelTopBySignedLevel.get(signedLevel) ?? (anchorCanvasNode.y + signedLevel * config.verticalSpacing),
        };
        const placement = placeBrowserAutoLayoutNode(nextArranged, original, desired, request.options);
        nextArranged = [...nextArranged, {
          ...original,
          ...placement,
          manuallyPlaced: false,
        }];
        componentBottom = Math.max(componentBottom, placement.y);
      }
    }
  }

  const unassignedNodes = freeNodes
    .filter((node) => (nextArranged.findIndex((arrangedNode) => arrangedNode.kind === 'entity' && arrangedNode.id === node.id) < 0))
    .sort(compareNodePriority);
  if (unassignedNodes.length > 0) {
    const fallbackOrigin = buildFallbackFreeNodeOrigin(nextArranged, Math.max(fallbackOriginY, componentBottom + config.componentSpacing));
    const fallbackXPositions = buildCenteredHorizontalLeftPositions(
      unassignedNodes,
      fallbackOrigin.x + (unassignedNodes.length * config.horizontalSpacing) / 2,
      config,
    );
    for (const [index, layoutNode] of unassignedNodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const placement = placeBrowserAutoLayoutNode(nextArranged, original, {
        x: fallbackXPositions[index] ?? fallbackOrigin.x,
        y: fallbackOrigin.y,
      }, request.options);
      nextArranged = [...nextArranged, {
        ...original,
        ...placement,
        manuallyPlaced: false,
      }];
      componentBottom = Math.max(componentBottom, placement.y);
    }
  }

  const anchoredSideByNodeId = new Map<string, 'above' | 'below' | 'neutral'>(anchorNodes.map((node) => [node.id, 'neutral']));
  for (const anchorNode of anchorNodes) {
    const signedLevels = assignSignedLevelsFromAnchor(componentNodes, componentEdges, anchorNode.id);
    for (const node of freeNodes) {
      const signedLevel = signedLevels.get(node.id);
      if (signedLevel === undefined) {
        continue;
      }
      anchoredSideByNodeId.set(node.id, signedLevel < 0 ? 'above' : signedLevel > 0 ? 'below' : 'neutral');
    }
  }
  nextArranged = enforceAnchoredPlacementClearance(nextArranged, freeNodes.map((node) => node.id), request, anchoredSideByNodeId);

  return {
    arranged: nextArranged,
    nextOriginY: componentBottom + config.verticalSpacing + config.componentSpacing,
  };
}
