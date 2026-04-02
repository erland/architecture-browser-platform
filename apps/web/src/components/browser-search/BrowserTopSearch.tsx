import { useEffect, useState } from 'react';
import type { BrowserSearchResult } from '../../browserSnapshotIndex';

export type BrowserTopSearchScopeMode = 'selected-scope' | 'entire-snapshot';

export type BrowserTopSearchResultAction = {
  type: 'select-scope' | 'add-scope-primary-entities' | 'open-entity' | 'open-relationship' | 'open-diagnostic';
  id: string;
  scopeId: string | null;
  kind: BrowserSearchResult['kind'];
};

export type BrowserTopSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  scopeMode: BrowserTopSearchScopeMode;
  onScopeModeChange: (mode: BrowserTopSearchScopeMode) => void;
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


export function toBrowserTopSearchAddAction(result: BrowserSearchResult): BrowserTopSearchResultAction {
  if (result.kind === 'scope') {
    return {
      type: 'add-scope-primary-entities',
      id: result.id,
      scopeId: result.scopeId,
      kind: result.kind,
    };
  }
  return toBrowserTopSearchAction(result);
}

export function BrowserTopSearch({
  query,
  onQueryChange,
  scopeMode,
  onScopeModeChange,
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
            Scope
          </button>
          <button
            type="button"
            className={scopeMode === 'entire-snapshot' ? 'button-secondary browser-top-search__toggle browser-top-search__toggle--active' : 'button-secondary browser-top-search__toggle'}
            onClick={() => onScopeModeChange('entire-snapshot')}
            disabled={disabled}
          >
            Snapshot
          </button>
        </div>
      </div>

      {query.trim() ? (
        <div className="browser-top-search__meta">
          <span className="badge">{results.length} hits</span>
        </div>
      ) : null}

      {isOpen ? (
        <div className="browser-top-search__results card" role="listbox" aria-label="Local search results">
          {results.length > 0 ? (
            <ul className="browser-top-search__result-list">
              {results.slice(0, 8).map((result) => {
                const action = toBrowserTopSearchAction(result);
                const addAction = result.kind === 'scope' ? toBrowserTopSearchAddAction(result) : null;
                return (
                  <li key={`${result.kind}:${result.id}`} className="browser-top-search__result-row">
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
                    {addAction ? (
                      <button
                        type="button"
                        className="button-secondary browser-top-search__result-add"
                        onClick={() => {
                          onActivateResult(addAction);
                          setIsOpen(false);
                        }}
                        aria-label={`Add primary entities for ${result.title}`}
                        title="Add primary entities"
                      >
                        Add
                      </button>
                    ) : null}
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
