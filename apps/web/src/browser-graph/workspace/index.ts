/**
 * Strict ownership entrypoint for the browser-graph workspace stage.
 *
 * Owns:
 * - projection-to-workspace normalization
 * - browser workspace model assembly
 * - composition of browser projection output with routing results
 *
 * Does not own:
 * - snapshot query/index logic
 * - layout engine orchestration
 * - React rendering
 */

export * from './browser-graph';
