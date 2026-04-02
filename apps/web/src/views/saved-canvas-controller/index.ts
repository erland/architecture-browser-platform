/**
 * Canonical public entrypoint for Browser saved-canvas controller orchestration.
 *
 * Import saved-canvas view/controller surfaces from `views/saved-canvas-controller`.
 * Deep imports remain temporarily supported during migration, but should be
 * treated as internal unless explicitly re-exported here.
 */

export { useBrowserSavedCanvasController } from './useBrowserSavedCanvasController';
export * from './savedCanvasControllerPorts';
export * from './savedCanvasControllerActions';
