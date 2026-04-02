/**
 * Canonical presentation-stage barrel for the browser graph pipeline.
 *
 * Ownership:
 * - association display semantics
 * - viewpoint presentation policy
 *
 * This stage is used by projection and UI rendering, but it does not own
 * routing or workspace-model construction.
 */

export * from './browserRelationshipSemantics';
export * from './browserViewpointPresentation';
