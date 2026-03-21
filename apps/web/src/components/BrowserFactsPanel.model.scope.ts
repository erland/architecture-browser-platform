import {
  getChildScopes,
  getDirectEntitiesForScope,
  getPrimaryEntitiesForScope,
  getScopeFacts,
  getSubtreeEntitiesForScope,
  type BrowserScopeFacts,
  type BrowserSnapshotIndex,
} from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';
import type {
  BrowserFactsPanelModel,
  BrowserFactsPanelScopeBridge,
  BrowserFactsPanelViewpointExplanation,
} from './BrowserFactsPanel.types';
import { displayScopeName } from './BrowserFactsPanel.utils';
import { buildEntityGroups, toEntitySummary, toScopeSummary } from './BrowserFactsPanel.model.shared';

export function buildScopeBridge(index: BrowserSnapshotIndex, scopeFacts: BrowserScopeFacts): BrowserFactsPanelScopeBridge {
  const scope = scopeFacts.scope;
  const childScopes = getChildScopes(index, scope.externalId).map((childScope) => toScopeSummary(index, childScope));
  const primaryEntities = getPrimaryEntitiesForScope(index, scope.externalId).map(toEntitySummary);
  const directEntitiesRaw = getDirectEntitiesForScope(index, scope.externalId);
  const subtreeEntitiesRaw = getSubtreeEntitiesForScope(index, scope.externalId);
  const parentScope = scope.parentScopeId ? index.scopesById.get(scope.parentScopeId) ?? null : null;

  return {
    parentScope: parentScope ? toScopeSummary(index, parentScope) : null,
    childScopes,
    primaryEntities,
    directEntities: directEntitiesRaw.map(toEntitySummary),
    subtreeEntities: subtreeEntitiesRaw.map(toEntitySummary),
    directEntityGroups: buildEntityGroups(directEntitiesRaw),
    subtreeEntityGroups: buildEntityGroups(subtreeEntitiesRaw),
  };
}

export function buildScopeFactsPanelModel(
  state: BrowserSessionState,
  scopeId: string,
  viewpointExplanation: BrowserFactsPanelViewpointExplanation | null,
): BrowserFactsPanelModel | null {
  const index = state.index;
  if (!index) {
    return null;
  }
  const scopeFacts = getScopeFacts(index, scopeId);
  if (!scopeFacts) {
    return null;
  }
  const scopeBridge = buildScopeBridge(index, scopeFacts);
  return {
    title: displayScopeName(scopeFacts.scope),
    subtitle: [scopeFacts.scope.kind, scopeFacts.path].filter(Boolean).join(' • '),
    mode: 'scope',
    badges: [
      `${scopeFacts.childScopeIds.length} children`,
      `${scopeBridge.primaryEntities.length} primary entities`,
      `${scopeBridge.directEntities.length} direct entities`,
      `${scopeBridge.subtreeEntities.length} subtree entities`,
      `${scopeFacts.diagnostics.length} diagnostics`,
    ],
    summary: [
      scopeFacts.scope.externalId,
      `Parent ${scopeBridge.parentScope?.path ?? 'Root scope'}`,
      `Descendant scopes ${scopeFacts.descendantScopeCount}`,
      `Source refs ${scopeFacts.sourceRefs.length}`,
    ],
    diagnostics: scopeFacts.diagnostics,
    sourceRefs: scopeFacts.sourceRefs,
    relationship: null,
    relationshipMetadata: null,
    scopeFacts,
    entityFacts: null,
    scopeBridge,
    viewpointExplanation,
  };
}
