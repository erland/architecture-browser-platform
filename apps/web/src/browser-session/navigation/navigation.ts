import { getViewpointById } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState, BrowserSessionState } from '../model/types';
import { buildAppliedViewpointGraph } from '../viewpoints/helpers';
import { recomputeBrowserSearchState } from './invariants';
import type { BrowserTreeMode } from '../../browser-snapshot';

export function selectBrowserScope(state: BrowserSessionState, scopeId: string | null): BrowserSessionState {
  const selectedScopeId = scopeId && state.index?.scopesById.has(scopeId) ? scopeId : null;
  const nextState: BrowserSessionState = {
    ...state,
    selectedScopeId,
    focusedElement: selectedScopeId ? { kind: 'scope', id: selectedScopeId } : state.focusedElement,
    factsPanelMode: selectedScopeId ? 'scope' : state.factsPanelMode,
  };
  const selectedViewpoint = nextState.viewpointSelection.viewpointId && nextState.index
    ? getViewpointById(nextState.index, nextState.viewpointSelection.viewpointId)
    : null;
  return {
    ...nextState,
    appliedViewpoint: selectedViewpoint ? buildAppliedViewpointGraph(nextState, selectedViewpoint, nextState.viewpointSelection) : nextState.appliedViewpoint,
  };
}

export function setBrowserSearch(state: BrowserSessionState, query: string, scopeId?: string | null): BrowserSessionState {
  return {
    ...state,
    ...recomputeBrowserSearchState(state, {
      query,
      searchScopeId: scopeId === undefined ? state.searchScopeId : scopeId,
    }),
  };
}

export function setBrowserTreeMode(state: BrowserSessionState, treeMode: BrowserTreeMode): BrowserSessionState {
  return {
    ...state,
    treeMode,
  };
}


export function setBrowserNavigationTreeState(state: BrowserSessionState, navigationTreeState: BrowserNavigationTreeViewState): BrowserSessionState {
  return {
    ...state,
    navigationTreeState: {
      expandedScopeIds: [...navigationTreeState.expandedScopeIds],
      expandedCategories: [...navigationTreeState.expandedCategories],
      expandedEntityIds: [...navigationTreeState.expandedEntityIds],
      expandedChildListNodeIds: [...navigationTreeState.expandedChildListNodeIds],
    },
  };
}
