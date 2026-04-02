/**
 * Canonical public entrypoint for the browser-snapshot query/index subsystem.
 *
 * Public consumers should import snapshot types, query helpers, and viewpoint
 * helpers from `browser-snapshot`. Internal stage code should prefer the more
 * precise `browser-snapshot/model`, `browser-snapshot/query`,
 * `browser-snapshot/support`, and `browser-snapshot/viewpoints` entrypoints.
 */

export * from './model';
export * from './query';
export * from './support';
export * from './viewpoints';

