/**
 * Canonical public entrypoint for the browser graph pipeline.
 *
 * Strict ownership model:
 * - `browser-projection/` owns projection building from browser/session state
 * - `browser-graph/workspace/` owns browser workspace model assembly from projection output
 * - `browser-canvas-placement/` owns initial and incremental placement decisions
 * - `browser-auto-layout/` owns layout engine orchestration and layout mode implementations
 * - `browser-routing/` owns generic edge-routing engine primitives and route extraction
 * - `browser-graph/routing/` owns browser-specific routing configuration only
 * - `browser-graph/presentation/` owns browser-facing display semantics and viewpoint policy
 * - `browser-graph/canvas/` owns browser-facing canvas sizing, viewport helpers, and placement-policy constants
 * - `components/browser-graph-workspace/` owns React rendering and interaction wiring only
 *
 * Prefer importing from a narrower stage-specific entrypoint when ownership matters.
 */

export * from './canvas';
export * from './presentation';
export * from './routing';
export * from './workspace';
