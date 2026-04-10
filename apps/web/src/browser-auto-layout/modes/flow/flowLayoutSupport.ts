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
  placeFlowAnchoredComponentNodes,
  placeFlowFreeComponentNodes,
} from './flowLayoutPhases';

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
    ? placeFlowAnchoredComponentNodes(componentModel, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeFlowFreeComponentNodes(componentModel, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserFlowAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const placementState = runBrowserAutoLayoutComponentPipeline({
    context,
    placeComponent: ({ component, context, nodeById, canvasNodeByKey, state }) => placeComponentNodes(
      component,
      context,
      nodeById,
      canvasNodeByKey,
      state.arranged,
      state.nextOriginY,
    ),
  });

  return buildAutoLayoutResult(context, 'flow', placementState.arranged);
}
