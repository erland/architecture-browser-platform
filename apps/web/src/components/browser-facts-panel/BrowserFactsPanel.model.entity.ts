import { getEntityFacts } from '../../browser-snapshot';
import type { BrowserSessionState } from '../../browser-session';
import type { BrowserFactsPanelModel, BrowserFactsPanelViewpointExplanation } from './BrowserFactsPanel.types';
import { displayEntityName } from './BrowserFactsPanel.utils';

export function buildEntityFactsPanelModel(
  state: BrowserSessionState,
  entityId: string,
  viewpointExplanation: BrowserFactsPanelViewpointExplanation | null,
): BrowserFactsPanelModel | null {
  const index = state.index;
  if (!index) {
    return null;
  }
  const entityFacts = getEntityFacts(index, entityId);
  if (!entityFacts) {
    return null;
  }
  return {
    title: displayEntityName(entityFacts.entity),
    subtitle: [entityFacts.entity.kind, entityFacts.path].filter(Boolean).join(' • '),
    mode: 'entity',
    badges: [
      entityFacts.entity.origin ?? 'local',
      `${entityFacts.inboundRelationships.length} inbound`,
      `${entityFacts.outboundRelationships.length} outbound`,
      `${entityFacts.diagnostics.length} diagnostics`,
    ],
    summary: [
      entityFacts.entity.externalId,
      entityFacts.scope ? `Scope ${entityFacts.path ?? entityFacts.scope.externalId}` : 'No scope assigned',
      `Source refs ${entityFacts.sourceRefs.length}`,
    ],
    diagnostics: entityFacts.diagnostics,
    sourceRefs: entityFacts.sourceRefs,
    relationship: null,
    relationshipMetadata: null,
    evidenceRelationships: [],
    scopeFacts: null,
    entityFacts,
    scopeBridge: null,
    viewpointExplanation,
  };
}
