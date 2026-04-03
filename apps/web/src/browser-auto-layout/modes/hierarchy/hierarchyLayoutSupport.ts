import type { BrowserAutoLayoutResult } from '../../core/types';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import {
  buildHierarchyForest,
  placeAnchoredHierarchyComponentNodes,
  placeHierarchyTree,
} from './hierarchyLayoutPhases';
import { buildAutoLayoutResult } from '../../shared/browserAutoLayoutSupportShared';
import { runBrowserAutoLayoutComponentPipeline } from '../../shared/componentPlacementPipeline';
import {
  buildBrowserAutoLayoutComponentModel,
  createBrowserAutoLayoutComponentOrigin,
  getBrowserAutoLayoutNextComponentOriginX,
} from '../../shared/componentModel';

export function runBrowserHierarchyAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const placementState = runBrowserAutoLayoutComponentPipeline({
    context,
    includeComponent: ({ component, context, nodeById }) => buildBrowserAutoLayoutComponentModel(component, context, nodeById).entityNodes.length > 0,
    placeComponent: ({ component, context, nodeById, canvasNodeByKey, state }) => {
      const componentModel = buildBrowserAutoLayoutComponentModel(component, context, nodeById);
      if (componentModel.entityNodes.length === 0) {
        return {
          arranged: state.arranged,
          nextOriginX: state.nextOriginX,
          nextOriginY: state.nextOriginY,
        };
      }

      if (componentModel.hasHardAnchors) {
        const anchoredPlacement = placeAnchoredHierarchyComponentNodes(
          componentModel,
          context,
          nodeById,
          canvasNodeByKey,
          state.arranged,
          state.nextOriginY,
        );
        return {
          arranged: anchoredPlacement.arranged,
          nextOriginX: getBrowserAutoLayoutNextComponentOriginX(anchoredPlacement.arranged),
          nextOriginY: anchoredPlacement.nextOriginY,
        };
      }

      const forest = buildHierarchyForest(componentModel.entityNodes, componentModel.edges, context.graph, context.request);
      const subtreeMemo = new Map<string, number>();
      let componentArranged = [...state.arranged];
      let componentOriginX = state.nextOriginX;
      let componentBottomY = state.nextOriginY;
      const componentOrigin = createBrowserAutoLayoutComponentOrigin(state.arranged, state.nextOriginY);

      for (const rootId of forest.rootIds) {
        const placement = placeHierarchyTree(
          rootId,
          componentOriginX,
          componentOrigin.y,
          forest,
          nodeById,
          canvasNodeByKey,
          componentArranged,
          context.request,
          subtreeMemo,
        );
        componentArranged = placement.arranged;
        componentOriginX = placement.nextOriginX;
        componentBottomY = Math.max(componentBottomY, placement.nextOriginY);
      }

      return {
        arranged: componentArranged,
        nextOriginX: getBrowserAutoLayoutNextComponentOriginX(componentArranged),
        nextOriginY: componentBottomY,
      };
    },
  });

  return buildAutoLayoutResult(context, 'hierarchy', placementState.arranged, { cleanupMode: 'compact-only' });
}
