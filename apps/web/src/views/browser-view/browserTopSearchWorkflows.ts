import type { BrowserTopSearchResultAction } from '../../components/browser-search/BrowserTopSearch';
import type { BrowserFocusPorts } from './browserViewFocusWorkflows';

export type BrowserTopSearchPorts = BrowserFocusPorts & {
  addEntityToCanvas: (entityId: string) => void;
  addPrimaryScopeEntitiesToCanvas: (scopeId: string) => void;
};

export function runTopSearchActionWorkflow(
  ports: BrowserTopSearchPorts,
  action: BrowserTopSearchResultAction,
) {
  const targetScopeId = action.kind === 'scope' ? action.id : action.scopeId;
  if (targetScopeId) {
    ports.selectScope(targetScopeId);
  }
  if (action.type === 'select-scope') {
    ports.focusElement({ kind: 'scope', id: action.id });
    ports.openFactsPanel('scope', 'right');
    ports.setActiveTab('layout');
    return;
  }
  if (action.type === 'add-scope-primary-entities') {
    ports.addPrimaryScopeEntitiesToCanvas(action.id);
    return;
  }
  if (action.type === 'open-entity') {
    ports.addEntityToCanvas(action.id);
    ports.focusElement({ kind: 'entity', id: action.id });
    ports.openFactsPanel('entity', 'right');
    ports.setActiveTab('search');
    return;
  }
  if (action.type === 'open-relationship') {
    ports.focusElement({ kind: 'relationship', id: action.id });
    ports.openFactsPanel('relationship', 'right');
    ports.setActiveTab('dependencies');
    return;
  }
  ports.focusElement(null);
  ports.openFactsPanel('hidden', 'right');
  ports.setActiveTab('search');
}
