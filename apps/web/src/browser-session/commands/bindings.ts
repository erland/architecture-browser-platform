import type { Dispatch, SetStateAction } from 'react';
import type { BrowserSessionState } from '../model/types';
import type { BrowserSessionActionGroups } from '../../contexts/browserSession.types';
import { bindBrowserSessionMutationGroup } from './types';
import {
  browserSessionCanvasMutations,
  browserSessionFactsPanelMutations,
  browserSessionLifecycleMutations,
  browserSessionNavigationMutations,
  browserSessionViewpointMutations,
} from './mutations';

export function createBoundBrowserSessionActionGroups(
  setState: Dispatch<SetStateAction<BrowserSessionState>>,
): BrowserSessionActionGroups {
  return {
    lifecycle: {
      ...bindBrowserSessionMutationGroup(setState, browserSessionLifecycleMutations),
      replaceState: (nextState) => setState(nextState),
    },
    navigation: {
      selectScope: bindBrowserSessionMutationGroup(setState, {
        selectScope: browserSessionNavigationMutations.selectBrowserScope,
      }).selectScope,
      setSearch: bindBrowserSessionMutationGroup(setState, {
        setSearch: browserSessionNavigationMutations.setBrowserSearch,
      }).setSearch,
      setTreeMode: bindBrowserSessionMutationGroup(setState, {
        setTreeMode: browserSessionNavigationMutations.setBrowserTreeMode,
      }).setTreeMode,
      setNavigationTreeState: bindBrowserSessionMutationGroup(setState, {
        setNavigationTreeState: browserSessionNavigationMutations.setBrowserNavigationTreeState,
      }).setNavigationTreeState,
    },
    viewpoint: {
      setSelectedViewpoint: bindBrowserSessionMutationGroup(setState, {
        setSelectedViewpoint: browserSessionViewpointMutations.setSelectedViewpoint,
      }).setSelectedViewpoint,
      setScopeMode: bindBrowserSessionMutationGroup(setState, {
        setScopeMode: browserSessionViewpointMutations.setViewpointScopeMode,
      }).setScopeMode,
      setApplyMode: bindBrowserSessionMutationGroup(setState, {
        setApplyMode: browserSessionViewpointMutations.setViewpointApplyMode,
      }).setApplyMode,
      setVariant: bindBrowserSessionMutationGroup(setState, {
        setVariant: browserSessionViewpointMutations.setViewpointVariant,
      }).setVariant,
      setPresentationPreference: bindBrowserSessionMutationGroup(setState, {
        setPresentationPreference: browserSessionViewpointMutations.setViewpointPresentationPreference,
      }).setPresentationPreference,
      applySelectedViewpoint: bindBrowserSessionMutationGroup(setState, {
        applySelectedViewpoint: browserSessionViewpointMutations.applySelectedViewpoint,
      }).applySelectedViewpoint,
    },
    canvas: {
      addScopeToCanvas: bindBrowserSessionMutationGroup(setState, {
        addScopeToCanvas: browserSessionCanvasMutations.addScopeToCanvas,
      }).addScopeToCanvas,
      addEntityToCanvas: bindBrowserSessionMutationGroup(setState, {
        addEntityToCanvas: browserSessionCanvasMutations.addEntityToCanvas,
      }).addEntityToCanvas,
      addEntitiesToCanvas: bindBrowserSessionMutationGroup(setState, {
        addEntitiesToCanvas: browserSessionCanvasMutations.addEntitiesToCanvas,
      }).addEntitiesToCanvas,
      addPrimaryEntitiesForScope: bindBrowserSessionMutationGroup(setState, {
        addPrimaryEntitiesForScope: browserSessionCanvasMutations.addPrimaryEntitiesForScope,
      }).addPrimaryEntitiesForScope,
      selectEntity: bindBrowserSessionMutationGroup(setState, {
        selectEntity: browserSessionCanvasMutations.selectCanvasEntity,
      }).selectEntity,
      addDependenciesToCanvas: bindBrowserSessionMutationGroup(setState, {
        addDependenciesToCanvas: browserSessionCanvasMutations.addDependenciesToCanvas,
      }).addDependenciesToCanvas,
      removeEntityFromCanvas: bindBrowserSessionMutationGroup(setState, {
        removeEntityFromCanvas: browserSessionCanvasMutations.removeEntityFromCanvas,
      }).removeEntityFromCanvas,
      isolateSelection: bindBrowserSessionMutationGroup(setState, {
        isolateSelection: browserSessionCanvasMutations.isolateCanvasSelection,
      }).isolateSelection,
      removeSelection: bindBrowserSessionMutationGroup(setState, {
        removeSelection: browserSessionCanvasMutations.removeCanvasSelection,
      }).removeSelection,
      toggleNodePin: bindBrowserSessionMutationGroup(setState, {
        toggleNodePin: browserSessionCanvasMutations.toggleCanvasNodePin,
      }).toggleNodePin,
      moveNode: bindBrowserSessionMutationGroup(setState, {
        moveNode: browserSessionCanvasMutations.moveCanvasNode,
      }).moveNode,
      reconcileNodePositions: bindBrowserSessionMutationGroup(setState, {
        reconcileNodePositions: browserSessionCanvasMutations.reconcileCanvasNodePositions,
      }).reconcileNodePositions,
      setViewport: bindBrowserSessionMutationGroup(setState, {
        setViewport: browserSessionCanvasMutations.setCanvasViewport,
      }).setViewport,
      panViewport: bindBrowserSessionMutationGroup(setState, {
        panViewport: browserSessionCanvasMutations.panCanvasViewport,
      }).panViewport,
      arrangeAllNodes: bindBrowserSessionMutationGroup(setState, {
        arrangeAllNodes: browserSessionCanvasMutations.arrangeAllCanvasNodesInteractive,
      }).arrangeAllNodes,
      arrangeWithMode: bindBrowserSessionMutationGroup(setState, {
        arrangeWithMode: browserSessionCanvasMutations.arrangeCanvasNodesInteractivelyWithMode,
      }).arrangeWithMode,
      arrangeAroundFocus: bindBrowserSessionMutationGroup(setState, {
        arrangeAroundFocus: browserSessionCanvasMutations.arrangeCanvasAroundFocus,
      }).arrangeAroundFocus,
      relayout: bindBrowserSessionMutationGroup(setState, {
        relayout: browserSessionCanvasMutations.relayoutCanvas,
      }).relayout,
      clear: bindBrowserSessionMutationGroup(setState, {
        clear: browserSessionCanvasMutations.clearCanvas,
      }).clear,
      fitView: bindBrowserSessionMutationGroup(setState, {
        fitView: browserSessionCanvasMutations.requestFitCanvasView,
      }).fitView,
    },
    factsPanel: {
      focusElement: bindBrowserSessionMutationGroup(setState, {
        focusElement: browserSessionFactsPanelMutations.focusBrowserElement,
      }).focusElement,
      open: bindBrowserSessionMutationGroup(setState, {
        open: browserSessionFactsPanelMutations.openFactsPanel,
      }).open,
    },
  };
}
