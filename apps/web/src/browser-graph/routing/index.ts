/**
 * Strict ownership entrypoint for the browser-graph routing stage.
 *
 * Owns:
 * - browser-specific routing/layout configuration
 *
 * Does not own:
 * - generic routing engine primitives (`browser-routing/`)
 * - workspace model assembly
 * - React rendering
 */

export * from './browser-graph';
