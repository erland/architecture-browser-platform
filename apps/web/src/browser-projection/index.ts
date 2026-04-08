/**
 * Strict ownership entrypoint for browser projection surfaces.
 *
 * Owns transformation from browser/session/snapshot state into projection
 * nodes and edges that can be consumed by workspace-stage assembly.
 *
 * Does not own layout, generic routing, or React rendering.
 */

export { buildBrowserProjectionModel } from './build';
export type {
  BrowserProjectionCompartment,
  BrowserProjectionEdgeSemanticStyle,
  BrowserProjectionCompartmentItem,
  BrowserProjectionCompartmentKind,
  BrowserProjectionEdge,
  BrowserProjectionModel,
  BrowserProjectionNode,
  BrowserProjectionNodeKind,
  BrowserProjectionSource,
} from './types';
