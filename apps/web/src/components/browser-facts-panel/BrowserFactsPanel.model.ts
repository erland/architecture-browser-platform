import type { BrowserSessionState } from '../../browserSessionStore';
import type { BrowserFactsPanelModel } from './BrowserFactsPanel.types';
import { buildEntityFactsPanelModel } from './BrowserFactsPanel.model.entity';
import { buildRelationshipFactsPanelModel } from './BrowserFactsPanel.model.relationship';
import { buildScopeFactsPanelModel } from './BrowserFactsPanel.model.scope';
import { buildViewpointExplanation } from './BrowserFactsPanel.model.shared';

export function buildBrowserFactsPanelModel(state: BrowserSessionState): BrowserFactsPanelModel | null {
  const index = state.index;
  const payload = state.payload;
  if (!index || !payload) {
    return null;
  }

  const selectedScopeId = state.selectedScopeId;
  const focused = state.focusedElement;
  const viewpointExplanation = buildViewpointExplanation(state);

  if (focused?.kind === 'relationship') {
    return buildRelationshipFactsPanelModel(state, focused.id, viewpointExplanation);
  }

  if (focused?.kind === 'entity') {
    return buildEntityFactsPanelModel(state, focused.id, viewpointExplanation);
  }

  if (focused?.kind === 'scope' || selectedScopeId) {
    const scopeId = focused?.kind === 'scope' ? focused.id : selectedScopeId;
    return scopeId ? buildScopeFactsPanelModel(state, scopeId, viewpointExplanation) : null;
  }

  return {
    title: payload.snapshot.snapshotKey,
    subtitle: 'Prepared snapshot overview',
    mode: 'overview',
    badges: [
      `${payload.scopes.length} scopes`,
      `${payload.entities.length} entities`,
      `${payload.relationships.length} relationships`,
      `${payload.diagnostics.length} diagnostics`,
    ],
    summary: [
      `Catalog ${payload.snapshot.workspaceId}`,
      `Repository ${payload.snapshot.repositoryName ?? payload.snapshot.repositoryKey ?? payload.snapshot.repositoryRegistrationId}`,
      `Imported ${payload.snapshot.importedAt}`,
    ],
    diagnostics: payload.diagnostics.slice(0, 8),
    sourceRefs: [],
    relationship: null,
    relationshipMetadata: null,
    scopeFacts: null,
    entityFacts: null,
    scopeBridge: null,
    viewpointExplanation,
  };
}
