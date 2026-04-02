/**
 * Canonical public entrypoint for the browser-session subsystem.
 *
 * Prefer importing session store state, actions, and viewpoint helpers from
 * `browser-session` rather than legacy root-level compatibility shims.
 */

export * from './model';
export * from './navigation';
export * from './lifecycle';
export * from './facts-panel';
export * from './commands';
