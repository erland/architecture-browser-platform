/**
 * Canonical canvas-stage barrel for the browser graph pipeline.
 *
 * Ownership:
 * - sizing and viewport helpers for workspace node rendering
 * - placement policy constants shared with placement/layout code
 *
 * This stage does not own projection building, auto-layout orchestration,
 * edge routing, or React rendering.
 */

export * from './browserCanvasPlacement.policy';
export * from './browserCanvasSizing';
export * from './browserCanvasViewport';
