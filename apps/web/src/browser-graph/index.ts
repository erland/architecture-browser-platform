/**
 * Canonical public entrypoint for the browser graph pipeline.
 *
 * Pipeline ownership:
 * - `browser-projection/` builds projection nodes/edges from browser session state
 * - `browser-graph/workspace` normalizes projection output into workspace nodes/edges
 * - `browser-routing/` owns generic edge-routing engine primitives
 * - `browser-graph/presentation` owns browser-facing display semantics/policies
 * - `browser-graph/canvas` owns browser-facing node sizing and viewport helpers
 * - `components/browser-graph-workspace/` owns React rendering only
 *
 * Prefer importing graph-facing helpers from this surface unless a narrower
 * stage-specific entrypoint communicates ownership better.
 */

export * from './canvas';
export * from './presentation';
export * from './routing';
export * from './workspace';
