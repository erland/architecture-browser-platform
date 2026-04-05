/**
 * Compatibility façade for legacy canvas mutation imports.
 *
 * Keep this file as a thin re-export barrel only.
 * New behavior should live in the focused mutations.* modules.
 */

export {
  removeEntityFromCanvas,
  isolateCanvasSelection,
  removeCanvasSelection,
} from './mutations.graph';

export {
  focusBrowserElement,
  selectCanvasEntity,
  clearCanvasSelection,
  selectAllCanvasEntities,
} from './mutations.selection';

export { openFactsPanel } from './mutations.factsPanel';

export {
  moveCanvasNode,
  reconcileCanvasNodePositions,
  toggleCanvasNodePin,
} from './mutations.nodes';

export {
  setCanvasEntityClassPresentationMode,
  toggleCanvasEntityClassPresentationMembers,
} from './mutations.presentation';
