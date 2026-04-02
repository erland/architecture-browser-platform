/**
 * Canonical routing-config barrel for the browser graph pipeline.
 *
 * Ownership:
 * - browser-specific routing/layout configuration defaults and normalization
 *
 * The concrete edge-routing engine itself lives in `browser-routing/`.
 */

export * from './browserRoutingLayoutConfig';
