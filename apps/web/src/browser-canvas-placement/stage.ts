/**
 * Narrow stage contract consumed by adjacent graph pipeline stages.
 *
 * Owns the subset of browser-canvas-placement APIs that auto-layout and
 * workspace-stage code may depend on without reaching into placement internals.
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
  getNodeSize,
} from './collision';

export { cleanupArrangedCanvasNodes } from './postLayoutCleanup';
