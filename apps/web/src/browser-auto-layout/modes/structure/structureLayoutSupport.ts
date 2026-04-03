import type { BrowserCanvasNode } from '../../../browser-session';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutResult,
} from '../../core/types';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import { buildAutoLayoutResult } from '../../shared/browserAutoLayoutSupportShared';
import { runBrowserAutoLayoutComponentPipeline } from '../../shared/componentPlacementPipeline';
import { buildBrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import {
  placeStructureAnchoredComponentNodes,
  placeStructureFreeComponentNodes,
} from './structureLayoutPhases';

function placeComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const componentModel = buildBrowserAutoLayoutComponentModel(component, context, nodeById);

  return componentModel.hasHardAnchors
    ? placeStructureAnchoredComponentNodes(componentModel, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeStructureFreeComponentNodes(componentModel, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserStructureAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const placementState = runBrowserAutoLayoutComponentPipeline({
    context,
    enableOrderingHeuristics: context.config.enableOrderingHeuristics,
    placeComponent: ({ component, context, nodeById, canvasNodeByKey, state }) => placeComponentNodes(
      component,
      context,
      nodeById,
      canvasNodeByKey,
      state.arranged,
      state.nextOriginY,
    ),
  });

  return buildAutoLayoutResult(context, 'structure', placementState.arranged);
}
