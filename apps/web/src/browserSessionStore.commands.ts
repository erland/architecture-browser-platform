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
  focusBrowserElement,
  isolateCanvasSelection,
  moveCanvasNode,
  openFactsPanel,
  panCanvasViewport,
  reconcileCanvasNodePositions,
  relayoutCanvas,
  removeCanvasSelection,
  removeEntityFromCanvas,
  requestFitCanvasView,
  selectCanvasEntity,
  setCanvasViewport,
  toggleCanvasNodePin,
} from './browserSessionStore.canvas';
import { openSnapshotSession } from './browserSessionStore.lifecycle';
import { selectBrowserScope, setBrowserSearch, setBrowserTreeMode } from './browserSessionStore.navigation';
import {
  applySelectedViewpoint,
  setSelectedViewpoint,
  setViewpointApplyMode,
  setViewpointPresentationPreference,
  setViewpointScopeMode,
  setViewpointVariant,
} from './browserSessionStore.viewpoints';

export const browserSessionLifecycleCommands = {
  openSnapshotSession,
};

export const browserSessionNavigationCommands = {
  selectBrowserScope,
  setBrowserSearch,
  setBrowserTreeMode,
};

export const browserSessionViewpointCommands = {
  setSelectedViewpoint,
  setViewpointScopeMode,
  setViewpointApplyMode,
  setViewpointVariant,
  setViewpointPresentationPreference,
  applySelectedViewpoint,
};

export const browserSessionCanvasCommands = {
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

export const browserSessionFactsPanelCommands = {
  focusBrowserElement,
  openFactsPanel,
};
