import type { BrowserCanvasNode } from '../../../browser-session/types';
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
  placeBalancedAnchoredComponentNodes,
  placeBalancedFreeComponentNodes,
} from './balancedLayoutPhases';

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
    ? placeBalancedAnchoredComponentNodes(componentModel, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeBalancedFreeComponentNodes(componentModel, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserBalancedAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
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

  return buildAutoLayoutResult(context, 'balanced', placementState.arranged);
}
