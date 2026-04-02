import { computeSearchResults } from './search';
import type {
  BrowserCanvasEdge,
  BrowserFactsPanelMode,
  BrowserFocusedElement,
  BrowserSessionState,
} from '../model/types';
import { uniqueValues } from '../model/collections';

export function normalizeSelectedEntityIds(state: BrowserSessionState, selectedEntityIds = state.selectedEntityIds): string[] {
  if (!state.index) {
    return uniqueValues(selectedEntityIds);
  }
  return uniqueValues(selectedEntityIds.filter((entityId) => state.index?.entitiesById.has(entityId)));
}

export function normalizeSearchScopeId(state: BrowserSessionState, searchScopeId = state.searchScopeId): string | null {
  if (!searchScopeId) {
    return null;
  }
  return state.index?.scopesById.has(searchScopeId) ? searchScopeId : null;
}

export function recomputeBrowserSearchState(
  state: BrowserSessionState,
  options?: { query?: string; searchScopeId?: string | null },
): Pick<BrowserSessionState, 'searchQuery' | 'searchScopeId' | 'searchResults'> {
  const searchQuery = options?.query ?? state.searchQuery;
  const searchScopeId = normalizeSearchScopeId(state, options?.searchScopeId ?? state.searchScopeId);
  return {
    searchQuery,
    searchScopeId,
    searchResults: computeSearchResults(state.index, searchQuery, searchScopeId),
  };
}

export function deriveFactsPanelModeFromFocus(
  focusedElement: BrowserFocusedElement,
  fallbackMode: BrowserFactsPanelMode = 'hidden',
): BrowserFactsPanelMode {
  if (!focusedElement) {
    return 'hidden';
  }
  if (focusedElement.kind === 'relationship') {
    return 'relationship';
  }
  if (focusedElement.kind === 'scope') {
    return 'scope';
  }
  if (focusedElement.kind === 'entity') {
    return 'entity';
  }
  return fallbackMode;
}

export function normalizeFocusedElement(
  state: BrowserSessionState,
  options?: {
    focusedElement?: BrowserFocusedElement;
    selectedEntityIds?: string[];
    canvasEdges?: BrowserCanvasEdge[];
    fallbackScopeId?: string | null;
  },
): BrowserFocusedElement {
  const focusedElement = options?.focusedElement ?? state.focusedElement;
  if (!focusedElement) {
    return null;
  }

  if (focusedElement.kind === 'entity') {
    const selectedEntityIds = options?.selectedEntityIds ?? state.selectedEntityIds;
    const allowedEntityIds = new Set(normalizeSelectedEntityIds(state, selectedEntityIds));
    return allowedEntityIds.has(focusedElement.id) ? focusedElement : null;
  }

  if (focusedElement.kind === 'scope') {
    const fallbackScopeId = options?.fallbackScopeId;
    if (fallbackScopeId && focusedElement.id === fallbackScopeId) {
      return focusedElement;
    }
    return state.index?.scopesById.has(focusedElement.id) ? focusedElement : null;
  }

  const canvasEdges = options?.canvasEdges ?? state.canvasEdges;
  return canvasEdges.some((edge) => edge.relationshipId === focusedElement.id) ? focusedElement : null;
}

export function normalizeFocusedBrowserContext(
  state: BrowserSessionState,
  options?: {
    focusedElement?: BrowserFocusedElement;
    selectedEntityIds?: string[];
    canvasEdges?: BrowserCanvasEdge[];
    fallbackScopeId?: string | null;
  },
): Pick<BrowserSessionState, 'selectedEntityIds' | 'focusedElement' | 'factsPanelMode'> {
  const selectedEntityIds = normalizeSelectedEntityIds(state, options?.selectedEntityIds ?? state.selectedEntityIds);
  const focusedElement = normalizeFocusedElement(state, {
    focusedElement: options?.focusedElement ?? state.focusedElement,
    selectedEntityIds,
    canvasEdges: options?.canvasEdges ?? state.canvasEdges,
    fallbackScopeId: options?.fallbackScopeId,
  }) ?? (selectedEntityIds[0] ? { kind: 'entity' as const, id: selectedEntityIds[0] } : null);

  return {
    selectedEntityIds,
    focusedElement,
    factsPanelMode: deriveFactsPanelModeFromFocus(focusedElement, state.factsPanelMode),
  };
}
