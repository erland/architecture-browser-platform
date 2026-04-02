import { useCallback } from 'react';
import type { BrowserSearchResult } from '../../../../browser-snapshot';
import type { BrowserTopSearchResultAction, BrowserTopSearchScopeMode } from '../../../../components/browser-search/BrowserTopSearch';

type BrowserSessionSearchLike = {
  state: {
    index: unknown;
    searchQuery: string;
    searchResults: BrowserSearchResult[];
    selectedScopeId: string | null;
  };
  navigation: {
    setSearch: (query: string, scopeId: string | null) => void;
  };
};

type BrowserActionsLike = {
  effectiveTopSearchScopeId: string | null;
  handleTopSearchResult: (action: BrowserTopSearchResultAction) => void;
};

type BrowserLayoutLike = {
  topSearchScopeMode: BrowserTopSearchScopeMode;
  setTopSearchScopeMode: (mode: BrowserTopSearchScopeMode) => void;
};

export function useBrowserViewSearchController({
  browserSession,
  browserActions,
  browserLayout,
}: {
  browserSession: BrowserSessionSearchLike;
  browserActions: BrowserActionsLike;
  browserLayout: BrowserLayoutLike;
}) {
  const handleQueryChange = useCallback((query: string) => {
    browserSession.navigation.setSearch(query, browserActions.effectiveTopSearchScopeId);
  }, [browserActions.effectiveTopSearchScopeId, browserSession]);

  const handleScopeModeChange = useCallback((mode: BrowserTopSearchScopeMode) => {
    browserLayout.setTopSearchScopeMode(mode);
    const nextScopeId = mode === 'selected-scope' ? browserSession.state.selectedScopeId : null;
    browserSession.navigation.setSearch(browserSession.state.searchQuery, nextScopeId);
  }, [browserLayout, browserSession]);

  return {
    query: browserSession.state.searchQuery,
    scopeMode: browserLayout.topSearchScopeMode,
    results: browserSession.state.searchResults,
    disabled: !browserSession.state.index,
    onQueryChange: handleQueryChange,
    onScopeModeChange: handleScopeModeChange,
    onActivateResult: browserActions.handleTopSearchResult,
  };
}
