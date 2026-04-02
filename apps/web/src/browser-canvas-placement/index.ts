/**
 * Strict ownership entrypoint for browser canvas placement.
 *
 * Owns:
 * - first-node placement
 * - appended/incremental placement
 * - relayout placement helpers
 * - post-layout cleanup
 *
 * Does not own layout engine mode orchestration or generic routing.
 */

export type {
  BrowserCanvasBounds,
  BrowserCanvasNodeLike,
  BrowserCanvasNodeSizeLike,
  BrowserCanvasPlacement,
  BrowserCanvasPlacementOptions,
} from './types';

export {
  avoidBrowserCanvasCollisions,
  getBrowserCanvasBounds,
} from './collision';

export {
  getDefaultCanvasNodePosition,
  placeAppendedCanvasNode,
  placeFirstCanvasNode,
} from './initialPlacement';

export {
  getCanvasNodeById,
  placeCanvasNodeNearAnchor,
  placeContainedCanvasNode,
  placePeerCanvasNode,
  planEntityInsertion,
  planScopeInsertion,
} from './incrementalPlacement';

export {
  arrangeCanvasNodesAroundEntityFocus,
  arrangeCanvasNodesInGrid,
} from './relayout';

export { cleanupArrangedCanvasNodes } from './postLayoutCleanup';
