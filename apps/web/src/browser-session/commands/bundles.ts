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
} from '../canvas';
import { openSnapshotSession } from '../lifecycle/lifecycle';
import { selectBrowserScope, setBrowserSearch, setBrowserTreeMode } from '../navigation/navigation';
import {
  applySelectedViewpoint,
  setSelectedViewpoint,
  setViewpointApplyMode,
  setViewpointPresentationPreference,
  setViewpointScopeMode,
  setViewpointVariant,
} from '../viewpoints';

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
