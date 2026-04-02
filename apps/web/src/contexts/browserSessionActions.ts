import type { Dispatch, SetStateAction } from 'react';
import {
  browserSessionCanvasCommands,
  browserSessionFactsPanelCommands,
  browserSessionLifecycleCommands,
  browserSessionNavigationCommands,
  browserSessionViewpointCommands,
  type BrowserSessionState,
} from '../browser-session';
import type { BrowserSessionActionGroups } from './browserSession.types';

export function createBrowserSessionActionGroups(
  setState: Dispatch<SetStateAction<BrowserSessionState>>,
): BrowserSessionActionGroups {
  return {
    lifecycle: {
      openSnapshotSession: (options) => setState((current) => browserSessionLifecycleCommands.openSnapshotSession(current, options)),
      replaceState: (nextState) => setState(nextState),
    },
    navigation: {
      selectScope: (scopeId) => setState((current) => browserSessionNavigationCommands.selectBrowserScope(current, scopeId)),
      setSearch: (query, scopeId) => setState((current) => browserSessionNavigationCommands.setBrowserSearch(current, query, scopeId)),
      setTreeMode: (treeMode) => setState((current) => browserSessionNavigationCommands.setBrowserTreeMode(current, treeMode)),
    },
    viewpoint: {
      setSelectedViewpoint: (viewpointId) => setState((current) => browserSessionViewpointCommands.setSelectedViewpoint(current, viewpointId)),
      setScopeMode: (scopeMode) => setState((current) => browserSessionViewpointCommands.setViewpointScopeMode(current, scopeMode)),
      setApplyMode: (applyMode) => setState((current) => browserSessionViewpointCommands.setViewpointApplyMode(current, applyMode)),
      setVariant: (variant) => setState((current) => browserSessionViewpointCommands.setViewpointVariant(current, variant)),
      setPresentationPreference: (preference) => setState((current) => browserSessionViewpointCommands.setViewpointPresentationPreference(current, preference)),
      applySelectedViewpoint: () => setState((current) => browserSessionViewpointCommands.applySelectedViewpoint(current)),
    },
    canvas: {
      addScopeToCanvas: (scopeId) => setState((current) => browserSessionCanvasCommands.addScopeToCanvas(current, scopeId)),
      addEntityToCanvas: (entityId) => setState((current) => browserSessionCanvasCommands.addEntityToCanvas(current, entityId)),
      addEntitiesToCanvas: (entityIds) => setState((current) => browserSessionCanvasCommands.addEntitiesToCanvas(current, entityIds)),
      addPrimaryEntitiesForScope: (scopeId) => setState((current) => browserSessionCanvasCommands.addPrimaryEntitiesForScope(current, scopeId)),
      selectEntity: (entityId, additive) => setState((current) => browserSessionCanvasCommands.selectCanvasEntity(current, entityId, additive)),
      addDependenciesToCanvas: (entityId, direction) => setState((current) => browserSessionCanvasCommands.addDependenciesToCanvas(current, entityId, direction)),
      removeEntityFromCanvas: (entityId) => setState((current) => browserSessionCanvasCommands.removeEntityFromCanvas(current, entityId)),
      isolateSelection: () => setState((current) => browserSessionCanvasCommands.isolateCanvasSelection(current)),
      removeSelection: () => setState((current) => browserSessionCanvasCommands.removeCanvasSelection(current)),
      toggleNodePin: (node) => setState((current) => browserSessionCanvasCommands.toggleCanvasNodePin(current, node)),
      moveNode: (node, position) => setState((current) => browserSessionCanvasCommands.moveCanvasNode(current, node, position)),
      reconcileNodePositions: (updates) => setState((current) => browserSessionCanvasCommands.reconcileCanvasNodePositions(current, updates)),
      setViewport: (viewport) => setState((current) => browserSessionCanvasCommands.setCanvasViewport(current, viewport)),
      panViewport: (delta) => setState((current) => browserSessionCanvasCommands.panCanvasViewport(current, delta)),
      arrangeAllNodes: () => setState((current) => browserSessionCanvasCommands.arrangeAllCanvasNodesInteractive(current)),
      arrangeWithMode: (mode) => setState((current) => browserSessionCanvasCommands.arrangeCanvasNodesInteractivelyWithMode(current, mode)),
      arrangeAroundFocus: () => setState((current) => browserSessionCanvasCommands.arrangeCanvasAroundFocus(current)),
      relayout: () => setState((current) => browserSessionCanvasCommands.relayoutCanvas(current)),
      clear: () => setState((current) => browserSessionCanvasCommands.clearCanvas(current)),
      fitView: () => setState((current) => browserSessionCanvasCommands.requestFitCanvasView(current)),
    },
    factsPanel: {
      focusElement: (focusedElement) => setState((current) => browserSessionFactsPanelCommands.focusBrowserElement(current, focusedElement)),
      open: (mode, location) => setState((current) => browserSessionFactsPanelCommands.openFactsPanel(current, mode, location)),
    },
  };
}
