import { useEffect, useMemo, useState } from 'react';
import type { BrowserSearchResult } from '../browserSnapshotIndex';

export type BrowserTopSearchScopeMode = 'selected-scope' | 'entire-snapshot';

export type BrowserTopSearchResultAction = {
  type: 'select-scope' | 'open-entity' | 'open-relationship' | 'open-diagnostic';
  id: string;
  scopeId: string | null;
  kind: BrowserSearchResult['kind'];
};

type BrowserTopSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  scopeMode: BrowserTopSearchScopeMode;
  onScopeModeChange: (mode: BrowserTopSearchScopeMode) => void;
  selectedScopeLabel: string | null;
  results: BrowserSearchResult[];
  onActivateResult: (action: BrowserTopSearchResultAction) => void;
  disabled?: boolean;
};

function formatResultMeta(result: BrowserSearchResult) {
  const parts = [result.kind.replace('-', ' ')];
  if (result.scopeId) {
    parts.push(result.scopeId);
  }
  return parts.join(' · ');
}

export function toBrowserTopSearchAction(result: BrowserSearchResult): BrowserTopSearchResultAction {
  if (result.kind === 'scope') {
    return {
      type: 'select-scope',
      id: result.id,
      scopeId: result.scopeId,
      kind: result.kind,
    };
  }
  if (result.kind === 'entity') {
    return {
      type: 'open-entity',
      id: result.id,
      scopeId: result.scopeId,
      kind: result.kind,
    };
  }
  if (result.kind === 'relationship') {
    return {
      type: 'open-relationship',
      id: result.id,
      scopeId: result.scopeId,
      kind: result.kind,
    };
  }
  return {
    type: 'open-diagnostic',
    id: result.id,
    scopeId: result.scopeId,
    kind: result.kind,
  };
}

export function BrowserTopSearch({
  query,
  onQueryChange,
  scopeMode,
  onScopeModeChange,
  selectedScopeLabel,
  results,
  onActivateResult,
  disabled = false,
}: BrowserTopSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
  }, [query, results.length]);

  const helperText = useMemo(() => {
    if (scopeMode === 'selected-scope' && selectedScopeLabel) {
      return `Local search is limited to ${selectedScopeLabel}.`;
    }
    if (scopeMode === 'selected-scope') {
      return 'Select a scope to limit local search to the current branch.';
    }
    return 'Local search is scanning the entire prepared snapshot.';
  }, [scopeMode, selectedScopeLabel]);

  return (
    <section className="browser-top-search" aria-label="Local Browser search">
      <div className="browser-top-search__row">
        <label className="browser-top-search__field" htmlFor="browser-top-search-input">
          <span className="eyebrow">Local search</span>
          <input
            id="browser-top-search-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search scopes, entities, relationships, diagnostics"
            disabled={disabled}
            autoComplete="off"
          />
        </label>

        <div className="browser-top-search__toggles" role="group" aria-label="Search scope">
          <button
            type="button"
            className={scopeMode === 'selected-scope' ? 'button-secondary browser-top-search__toggle browser-top-search__toggle--active' : 'button-secondary browser-top-search__toggle'}
            onClick={() => onScopeModeChange('selected-scope')}
            disabled={disabled}
          >
            Current scope
          </button>
          <button
            type="button"
            className={scopeMode === 'entire-snapshot' ? 'button-secondary browser-top-search__toggle browser-top-search__toggle--active' : 'button-secondary browser-top-search__toggle'}
            onClick={() => onScopeModeChange('entire-snapshot')}
            disabled={disabled}
          >
            Entire snapshot
          </button>
        </div>
      </div>

      <div className="browser-top-search__meta">
        <p className="muted">{helperText}</p>
        {query.trim() ? <span className="badge">{results.length} hits</span> : <span className="badge">Type to search locally</span>}
      </div>

      {isOpen ? (
        <div className="browser-top-search__results card" role="listbox" aria-label="Local search results">
          {results.length > 0 ? (
            <ul className="browser-top-search__result-list">
              {results.slice(0, 8).map((result) => {
                const action = toBrowserTopSearchAction(result);
                return (
                  <li key={`${result.kind}:${result.id}`}>
                    <button
                      type="button"
                      className="browser-top-search__result"
                      onClick={() => {
                        onActivateResult(action);
                        setIsOpen(false);
                      }}
                    >
                      <span className="browser-top-search__result-main">
                        <strong>{result.title}</strong>
                        <span className="muted">{result.subtitle}</span>
                      </span>
                      <span className="browser-top-search__result-meta">{formatResultMeta(result)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted browser-top-search__empty">No local matches for this query.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
