import { useCallback, useEffect } from 'react';
import { getContainedEntitiesForEntity, getContainingEntitiesForEntity, getDirectEntitiesForScopeByKind, getPrimaryEntitiesForScope, getSubtreeEntitiesForScopeByKind } from '../browserSnapshotIndex';
import type { BrowserTopSearchResultAction, BrowserTopSearchScopeMode } from '../components/BrowserTopSearch';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { BrowserTabKey } from '../routing/browserTabs';

export type BrowserViewActions = {
  effectiveTopSearchScopeId: string | null;
  handleTopSearchResult: (action: BrowserTopSearchResultAction) => void;
  handleAddPrimaryScopeEntitiesToCanvas: (scopeId: string) => void;
  handleAddScopeAnalysisToCanvas: (scopeId: string, mode: 'primary' | 'direct' | 'subtree' | 'children-primary', kinds?: string[], childScopeKinds?: string[]) => void;
  handleAddContainedEntitiesToCanvas: (entityId: string, kinds?: string[]) => void;
  handleAddPeerEntitiesToCanvas: (entityId: string, containerKinds?: string[], peerKinds?: string[]) => void;
};

type UseBrowserViewActionsArgs = {
  browserSession: BrowserSessionContextValue;
  activeTab: BrowserTabKey;
  setActiveTab: (tab: BrowserTabKey) => void;
  topSearchScopeMode: BrowserTopSearchScopeMode;
};

export function useBrowserViewActions({
  browserSession,
  setActiveTab,
  topSearchScopeMode,
}: UseBrowserViewActionsArgs): BrowserViewActions {
  const effectiveTopSearchScopeId = topSearchScopeMode === 'selected-scope'
    ? browserSession.state.selectedScopeId
    : null;

  useEffect(() => {
    if (topSearchScopeMode !== 'selected-scope') {
      return;
    }
    if (browserSession.state.searchScopeId === browserSession.state.selectedScopeId) {
      return;
    }
    browserSession.setSearch(browserSession.state.searchQuery, browserSession.state.selectedScopeId);
  }, [browserSession, topSearchScopeMode]);

  const focusCanvasEntities = useCallback((entityIds: string[], fallbackScopeId?: string) => {
    const trimmedEntityIds = [...new Set(entityIds)].slice(0, 24);
    browserSession.addEntitiesToCanvas(trimmedEntityIds);
    if (fallbackScopeId) {
      browserSession.selectScope(fallbackScopeId);
    }
    if (trimmedEntityIds[0]) {
      browserSession.focusElement({ kind: 'entity', id: trimmedEntityIds[0] });
      browserSession.openFactsPanel('entity', 'right');
    } else if (fallbackScopeId) {
      browserSession.focusElement({ kind: 'scope', id: fallbackScopeId });
      browserSession.openFactsPanel('scope', 'right');
    }
    setActiveTab('layout');
  }, [browserSession, setActiveTab]);

  const handleAddScopeAnalysisToCanvas = useCallback((scopeId: string, mode: 'primary' | 'direct' | 'subtree' | 'children-primary', kinds?: string[], childScopeKinds?: string[]) => {
    const index = browserSession.state.index;
    if (!index) {
      return;
    }

    let entityIds: string[] = [];
    if (mode === 'primary') {
      entityIds = getPrimaryEntitiesForScope(index, scopeId).map((entity) => entity.externalId);
    } else if (mode === 'direct') {
      entityIds = getDirectEntitiesForScopeByKind(index, scopeId, kinds).map((entity) => entity.externalId);
    } else if (mode === 'subtree') {
      entityIds = getSubtreeEntitiesForScopeByKind(index, scopeId, kinds).map((entity) => entity.externalId);
    } else {
      const allowedChildKinds = childScopeKinds && childScopeKinds.length > 0 ? new Set(childScopeKinds) : null;
      const childScopeIds = (index.childScopeIdsByParentId.get(scopeId) ?? []).filter((childScopeId) => {
        if (!allowedChildKinds) {
          return true;
        }
        return allowedChildKinds.has(index.scopesById.get(childScopeId)?.kind ?? '');
      });
      const collected = childScopeIds.flatMap((childScopeId) => getPrimaryEntitiesForScope(index, childScopeId).map((entity) => entity.externalId));
      entityIds = kinds && kinds.length > 0
        ? collected.filter((entityId) => kinds.includes(index.entitiesById.get(entityId)?.kind ?? ''))
        : collected;
    }

    focusCanvasEntities(entityIds, scopeId);
  }, [browserSession.state.index, focusCanvasEntities]);

  const handleAddPrimaryScopeEntitiesToCanvas = useCallback((scopeId: string) => {
    handleAddScopeAnalysisToCanvas(scopeId, 'primary');
  }, [handleAddScopeAnalysisToCanvas]);

  const handleAddContainedEntitiesToCanvas = useCallback((entityId: string, kinds?: string[]) => {
    const index = browserSession.state.index;
    if (!index) {
      return;
    }
    const entityIds = getContainedEntitiesForEntity(index, entityId)
      .filter((entity) => !kinds || kinds.includes(entity.kind))
      .map((entity) => entity.externalId);
    const fallbackScopeId = index.entitiesById.get(entityId)?.scopeId ?? undefined;
    focusCanvasEntities(entityIds, fallbackScopeId);
  }, [browserSession.state.index, focusCanvasEntities]);

  const handleAddPeerEntitiesToCanvas = useCallback((entityId: string, containerKinds?: string[], peerKinds?: string[]) => {
    const index = browserSession.state.index;
    if (!index) {
      return;
    }
    const allowedContainerKinds = containerKinds && containerKinds.length > 0 ? new Set(containerKinds) : null;
    const containers = getContainingEntitiesForEntity(index, entityId).filter((entity) => !allowedContainerKinds || allowedContainerKinds.has(entity.kind));
    const peerIds = new Set<string>();
    for (const container of containers) {
      for (const peer of getContainedEntitiesForEntity(index, container.externalId)) {
        if (peer.externalId === entityId) {
          continue;
        }
        if (peerKinds && peerKinds.length > 0 && !peerKinds.includes(peer.kind)) {
          continue;
        }
        peerIds.add(peer.externalId);
      }
    }
    const fallbackScopeId = index.entitiesById.get(entityId)?.scopeId ?? undefined;
    focusCanvasEntities([...peerIds], fallbackScopeId);
  }, [browserSession.state.index, focusCanvasEntities]);

  const handleTopSearchResult = useCallback((action: BrowserTopSearchResultAction) => {
    const targetScopeId = action.kind === 'scope' ? action.id : action.scopeId;
    if (targetScopeId) {
      browserSession.selectScope(targetScopeId);
    }
    if (action.type === 'select-scope') {
      browserSession.focusElement({ kind: 'scope', id: action.id });
      browserSession.openFactsPanel('scope', 'right');
      setActiveTab('layout');
      return;
    }
    if (action.type === 'add-scope-primary-entities') {
      handleAddPrimaryScopeEntitiesToCanvas(action.id);
      return;
    }
    if (action.type === 'open-entity') {
      browserSession.addEntityToCanvas(action.id);
      browserSession.focusElement({ kind: 'entity', id: action.id });
      browserSession.openFactsPanel('entity', 'right');
      setActiveTab('search');
      return;
    }
    if (action.type === 'open-relationship') {
      browserSession.focusElement({ kind: 'relationship', id: action.id });
      browserSession.openFactsPanel('relationship', 'right');
      setActiveTab('dependencies');
      return;
    }
    browserSession.focusElement(null);
    browserSession.openFactsPanel('hidden', 'right');
    setActiveTab('search');
  }, [browserSession, handleAddPrimaryScopeEntitiesToCanvas, setActiveTab]);

  return {
    effectiveTopSearchScopeId,
    handleTopSearchResult,
    handleAddPrimaryScopeEntitiesToCanvas,
    handleAddScopeAnalysisToCanvas,
    handleAddContainedEntitiesToCanvas,
    handleAddPeerEntitiesToCanvas,
  };
}
