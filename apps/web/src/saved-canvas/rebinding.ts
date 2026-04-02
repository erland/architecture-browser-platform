/**
 * Legacy compatibility facade.
 *
 * Prefer importing rebinding rules from `saved-canvas/domain`.
 */
export {
  buildSavedCanvasRebindingStatusMessage,
  toSavedCanvasRebindingUiSummary,
} from './rebinding/ui';
export type { SavedCanvasRebindingUiSummary } from './rebinding/ui';
export * from './domain/rebinding';
