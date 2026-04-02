/**
 * Adapter-layer local persistence surface for saved canvases.
 */
export {
  createSavedCanvasLocalStore,
  getBrowserSavedCanvasLocalStore,
  InMemorySavedCanvasLocalStorage,
} from '../../storage/localStore';
export type {
  SavedCanvasLocalListFilter,
  SavedCanvasLocalRecord,
  SavedCanvasLocalStorage,
  SavedCanvasLocalStore,
} from '../../storage/localStore';
