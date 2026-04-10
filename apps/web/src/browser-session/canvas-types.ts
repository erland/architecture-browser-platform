/**
 * Narrow canvas-oriented type entrypoint for browser-session consumers.
 *
 * Prefer this file when a consumer only needs canvas graph or presentation
 * shapes rather than the broader browser-session type surface.
 */

export type {
  BrowserCanvasEdge,
  BrowserCanvasLayoutMode,
  BrowserCanvasNode,
  BrowserCanvasViewport,
  BrowserClassPresentationMode,
  BrowserClassPresentationPolicy,
  BrowserGraphExpansionAction,
  BrowserRoutingConservativeDefaults,
  BrowserRoutingFeatureFlags,
  BrowserRoutingLayoutConfig,
} from './model/types';
