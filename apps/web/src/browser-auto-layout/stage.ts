/**
 * Narrow cross-stage contract consumed by adjacent graph pipeline stages.
 *
 * Owns the subset of browser-auto-layout APIs that placement-stage code may
 * depend on without reaching through the broader auto-layout entrypoint.
 */

export type {
  BrowserAutoLayoutCleanupIntensity,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from './core/types';

export { createBrowserAutoLayoutPipelineContext } from './core/pipeline';
