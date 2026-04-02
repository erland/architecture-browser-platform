/**
 * Strict ownership entrypoint for the browser-graph canvas stage.
 *
 * Owns:
 * - browser-facing node sizing
 * - viewport math/helpers
 * - placement-policy constants shared with layout/placement code
 *
 * Does not own:
 * - projection building
 * - layout orchestration
 * - edge-routing engine logic
 * - React rendering
 */

export * from './browser-graph';
