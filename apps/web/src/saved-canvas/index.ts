/**
 * Canonical public entrypoint for the saved-canvas subsystem.
 *
 * Layered entrypoints:
 * - `saved-canvas/domain` for document model and rebinding rules
 * - `saved-canvas/application` for browser-state, opening, and sync workflows
 * - `saved-canvas/adapters` for storage and browser-session integration
 *
 * This top-level facade re-exports the stable public surface for callers that
 * do not need to depend on a specific layer.
 */

export * from './domain';
export * from './application';
export * from './adapters';
export { buildSavedCanvasRebindingStatusMessage, toSavedCanvasRebindingUiSummary } from './rebinding/ui';
export type { SavedCanvasRebindingUiSummary } from './rebinding/ui';
