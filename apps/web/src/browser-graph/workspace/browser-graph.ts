/**
 * Canonical workspace-stage barrel for the browser graph pipeline.
 *
 * Ownership:
 * - projection-to-workspace normalization
 * - workspace model assembly
 * - workspace edge routing assembly
 *
 * This stage composes projection output with routing-engine input, but does
 * not render JSX.
 */

export * from './browserGraphWorkspaceProjection';
export * from './browserGraphWorkspaceRouting';
export * from './browserGraphWorkspaceModel';

export * from './browserGraphWorkspaceSummary';

export * from '../canvas/browserCanvasViewport';
