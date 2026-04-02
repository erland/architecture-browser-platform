/**
 * Canonical domain-layer public entrypoint for the saved-canvas subsystem.
 *
 * Domain exports stay pure and avoid direct storage, networking, or
 * browser-session orchestration concerns.
 */
export * from './model/document';
export { buildAcceptedSavedCanvasRebindingDocument } from './rebinding-impl/accepted';
export { rebindSavedCanvasToTargetSnapshot } from './rebinding-impl/rebind';
export type { SavedCanvasRebindResult } from './rebinding-impl/rebind';
export * from './rebinding-impl/stableReferences';
export * from './rebinding-impl/ui';
