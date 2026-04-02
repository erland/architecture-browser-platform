/**
 * Canonical public entrypoint for the browser-snapshot query/index subsystem.
 *
 * Prefer importing snapshot index/query/viewpoint helpers from `browser-snapshot`.
 */

export * from './query/aggregates';
export * from './browserSnapshotIndex.build';
export * from './support/display';
export * from './query/scopeQueries';
export * from './query/search';
export * from './support/semantics';
export * from './support/sort';
export * from './support/sourceRefs';
export * from './browserSnapshotIndex';
export * from './browserSnapshotIndex.types';
export * from './viewpoints';
