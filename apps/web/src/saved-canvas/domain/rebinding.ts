/**
 * Domain rebinding rules for saved-canvas documents.
 *
 * This layer owns stable references, accepted-rebinding document updates, and
 * rebinding result shaping that is independent from UI/controller concerns.
 */
export { buildAcceptedSavedCanvasRebindingDocument } from '../rebinding/accepted';
export { rebindSavedCanvasToTargetSnapshot } from '../rebinding/rebind';
export type { SavedCanvasRebindResult } from '../rebinding/rebind';
export * from '../rebinding/stableReferences';
