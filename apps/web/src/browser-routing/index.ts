/**
 * Strict ownership entrypoint for the generic browser routing engine.
 *
 * Owns:
 * - route extraction inputs
 * - routing engine primitives
 * - routing engine output types
 *
 * Does not own browser-specific routing defaults; those belong in
 * `browser-graph/routing/`.
 */

export * from './types';
export * from './extract';
export * from './engine';
