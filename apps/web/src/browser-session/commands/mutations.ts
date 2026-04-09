import {
  addDependenciesToCanvas,
  addEntitiesToCanvas,
  addEntityToCanvas,
  addPrimaryEntitiesForScope,
  addScopeToCanvas,
} from '../canvas/commands';
import {
  clearCanvasSelection,
  focusBrowserElement,
  selectAllCanvasEntities,
  selectCanvasEntity,
} from '../canvas/mutations.selection';
import {
  isolateCanvasSelection,
  removeCanvasSelection,
  removeEntityFromCanvas,
} from '../canvas/mutations.graph';
import {
  moveCanvasNode,
  reconcileCanvasNodePositions,
  toggleCanvasNodePin,
} from '../canvas/mutations.nodes';
import {
  setCanvasEntityClassPresentationMode,
  toggleCanvasEntityClassPresentationMembers,
} from '../canvas/mutations.presentation';
import { openFactsPanel } from '../facts-panel/actions';
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
import {
  arrangeAllCanvasNodesInteractive,
  arrangeCanvasAroundFocus,
  arrangeCanvasNodesInteractivelyWithMode,
  clearCanvas,
  panCanvasViewport,
  relayoutCanvas,
  requestFitCanvasView,
  setCanvasViewport,
  setRelationshipRoutingMode,
} from '../canvas/viewport';

/**
 * Canonical grouped browser-session mutation collections.
 *
 * Keep these objects focused on grouping already-owned commands.
 * Do not route new internal code through the public canvas barrel here.
 */

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
  clearCanvasSelection,
  isolateCanvasSelection,
  moveCanvasNode,
  panCanvasViewport,
  reconcileCanvasNodePositions,
  relayoutCanvas,
  removeCanvasSelection,
  selectAllCanvasEntities,
  removeEntityFromCanvas,
  requestFitCanvasView,
  selectCanvasEntity,
  setRelationshipRoutingMode,
  setCanvasEntityClassPresentationMode,
  setCanvasViewport,
  toggleCanvasEntityClassPresentationMembers,
  toggleCanvasNodePin,
};

export const browserSessionFactsPanelMutations = {
  focusBrowserElement,
  openFactsPanel,
};
