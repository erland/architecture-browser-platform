import { useCallback, useEffect } from 'react';
import type { BrowserTopSearchResultAction, BrowserTopSearchScopeMode } from '../components/BrowserTopSearch';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { runContainedEntitiesCommand, runPeerEntitiesCommand, runScopeAnalysisCommand, runTopSearchActionCommand, type BrowserFocusPorts } from './browserViewWorkflows';

export type BrowserViewActions = {
  effectiveTopSearchScopeId: string | null;
  handleTopSearchResult: (action: BrowserTopSearchResultAction) => void;
  handleAddPrimaryScopeEntitiesToCanvas: (scopeId: string) => void;
  handleAddScopeAnalysisToCanvas: (scopeId: string, mode: 'primary' | 'direct' | 'subtree' | 'children-primary', kinds?: string[], childScopeKinds?: string[]) => void;
  handleAddContainedEntitiesToCanvas: (entityId: string, kinds?: string[]) => void;
  handleAddPeerEntitiesToCanvas: (entityId: string, containerKinds?: string[], peerKinds?: string[]) => void;
};

type UseBrowserViewActionsArgs = {
  browserSession: Pick<BrowserSessionContextValue, 'state' | 'navigation' | 'canvas' | 'factsPanel'>;
  setActiveTab: (tab: 'layout' | 'search' | 'dependencies') => void;
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
    browserSession.navigation.setSearch(browserSession.state.searchQuery, browserSession.state.selectedScopeId);
  }, [browserSession, topSearchScopeMode]);

  const focusPorts: BrowserFocusPorts = {
    addEntitiesToCanvas: browserSession.canvas.addEntitiesToCanvas,
    selectScope: browserSession.navigation.selectScope,
    focusElement: browserSession.factsPanel.focusElement,
    openFactsPanel: browserSession.factsPanel.open,
    setActiveTab,
  };

  const handleAddScopeAnalysisToCanvas = useCallback((scopeId: string, mode: 'primary' | 'direct' | 'subtree' | 'children-primary', kinds?: string[], childScopeKinds?: string[]) => {
    runScopeAnalysisCommand(browserSession.state.index, focusPorts, scopeId, mode, kinds, childScopeKinds);
  }, [browserSession.state.index, focusPorts]);

  const handleAddPrimaryScopeEntitiesToCanvas = useCallback((scopeId: string) => {
    handleAddScopeAnalysisToCanvas(scopeId, 'primary');
  }, [handleAddScopeAnalysisToCanvas]);

  const handleAddContainedEntitiesToCanvas = useCallback((entityId: string, kinds?: string[]) => {
    runContainedEntitiesCommand(browserSession.state.index, focusPorts, entityId, kinds);
  }, [browserSession.state.index, focusPorts]);

  const handleAddPeerEntitiesToCanvas = useCallback((entityId: string, containerKinds?: string[], peerKinds?: string[]) => {
    runPeerEntitiesCommand(browserSession.state.index, focusPorts, entityId, containerKinds, peerKinds);
  }, [browserSession.state.index, focusPorts]);

  const handleTopSearchResult = useCallback((action: BrowserTopSearchResultAction) => {
    runTopSearchActionCommand({
      ...focusPorts,
      addEntityToCanvas: browserSession.canvas.addEntityToCanvas,
      addPrimaryScopeEntitiesToCanvas: handleAddPrimaryScopeEntitiesToCanvas,
    }, action);
  }, [browserSession.canvas.addEntityToCanvas, handleAddPrimaryScopeEntitiesToCanvas, focusPorts]);

  return {
    effectiveTopSearchScopeId,
    handleTopSearchResult,
    handleAddPrimaryScopeEntitiesToCanvas,
    handleAddScopeAnalysisToCanvas,
    handleAddContainedEntitiesToCanvas,
    handleAddPeerEntitiesToCanvas,
  };
}
