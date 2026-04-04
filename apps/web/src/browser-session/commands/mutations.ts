import {
  addDependenciesToCanvas,
  addEntitiesToCanvas,
  addEntityToCanvas,
  addPrimaryEntitiesForScope,
  addScopeToCanvas,
  arrangeAllCanvasNodesInteractive,
  arrangeCanvasAroundFocus,
  arrangeCanvasNodesInteractivelyWithMode,
  clearCanvas,
  isolateCanvasSelection,
  moveCanvasNode,
  panCanvasViewport,
  reconcileCanvasNodePositions,
  relayoutCanvas,
  removeCanvasSelection,
  removeEntityFromCanvas,
  requestFitCanvasView,
  selectCanvasEntity,
  setCanvasViewport,
  toggleCanvasNodePin,
} from '../canvas';
import { focusBrowserElement, openFactsPanel } from '../facts-panel/actions';
import { openSnapshotSession } from '../lifecycle/lifecycle';
import { selectBrowserScope, setBrowserNavigationTreeState, setBrowserSearch, setBrowserTreeMode } from '../navigation/navigation';
import {
  applySelectedViewpoint,
  setSelectedViewpoint,
  setViewpointApplyMode,
  setViewpointPresentationPreference,
  setViewpointScopeMode,
  setViewpointVariant,
} from '../viewpoints';

export const browserSessionLifecycleMutations = {
  openSnapshotSession,
};

export const browserSessionNavigationMutations = {
  selectBrowserScope,
  setBrowserSearch,
  setBrowserTreeMode,
  setBrowserNavigationTreeState,
};

export const browserSessionViewpointMutations = {
  setSelectedViewpoint,
  setViewpointScopeMode,
  setViewpointApplyMode,
  setViewpointVariant,
  setViewpointPresentationPreference,
  applySelectedViewpoint,
};

export const browserSessionCanvasMutations = {
  addDependenciesToCanvas,
  addEntitiesToCanvas,
  addEntityToCanvas,
  addPrimaryEntitiesForScope,
  addScopeToCanvas,
  arrangeAllCanvasNodesInteractive,
  arrangeCanvasAroundFocus,
  arrangeCanvasNodesInteractivelyWithMode,
  clearCanvas,
  isolateCanvasSelection,
  moveCanvasNode,
  panCanvasViewport,
  reconcileCanvasNodePositions,
  relayoutCanvas,
  removeCanvasSelection,
  removeEntityFromCanvas,
  requestFitCanvasView,
  selectCanvasEntity,
  setCanvasViewport,
  toggleCanvasNodePin,
};

export const browserSessionFactsPanelMutations = {
  focusBrowserElement,
  openFactsPanel,
};
