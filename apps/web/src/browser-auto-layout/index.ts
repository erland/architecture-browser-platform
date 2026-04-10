/**
 * Strict ownership entrypoint for browser auto-layout surfaces.
 *
 * Owns the layout engine core and the layout mode implementations that decide
 * how browser canvas nodes are arranged.
 *
 * Does not own initial placement, generic routing, or React rendering.
 */

export * from './core';

export { isBrowserAutoLayoutDebugEnabled } from './debug';
