/**
 * Legacy browser-session compatibility entrypoint.
 *
 * Keep this entrypoint intentionally narrow. New consumers should prefer the
 * dedicated category entrypoints instead:
 * - `browser-session/session-state-types`
 * - `browser-session/canvas-types`
 * - `browser-session/focus-types`
 * - `browser-session/viewpoint-types`
 * - `browser-session/state`
 * - `browser-session/lifecycle-api`
 * - `browser-session/navigation-api`
 * - `browser-session/canvas-api`
 * - `browser-session/viewpoints-api`
 * - `browser-session/facts-panel-api`
 * - `browser-session/commands-api`
 */

export * from './browserSessionStore';
