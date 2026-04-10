/**
 * Narrow cross-stage contract for canvas sizing and placement-policy helpers.
 *
 * Owns the subset of browser-graph/canvas APIs that layout and placement
 * stages may depend on without importing the broader canvas barrel.
 */

export {
  APPEND_CLUSTER_GAP,
  COLLISION_MARGIN,
  CONTAINED_OFFSET_X,
  CONTAINED_OFFSET_Y,
  GRID_X,
  GRID_Y,
  PEER_SPACING_X,
  PEER_SPACING_Y,
  RADIAL_RADIUS,
  roundToGrid,
} from './browserCanvasPlacement.policy';

export {
  BROWSER_ENTITY_NODE_SIZE,
  BROWSER_SCOPE_NODE_SIZE,
  getProjectionAwareCanvasNodeSize,
} from './browserCanvasSizing';
