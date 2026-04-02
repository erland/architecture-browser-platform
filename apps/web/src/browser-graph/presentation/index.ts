/**
 * Strict ownership entrypoint for the browser-graph presentation stage.
 *
 * Owns:
 * - browser-facing relationship semantics
 * - viewpoint presentation policy
 *
 * Does not own:
 * - snapshot indexing
 * - workspace model assembly
 * - route extraction
 * - React rendering
 */

export * from './browser-graph';
