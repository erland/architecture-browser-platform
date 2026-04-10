import type { BrowserSessionState } from '../../browser-session/types';
import type { BrowserFactsPanelModel, BrowserFactsPanelViewpointExplanation } from './BrowserFactsPanel.types';
import { buildRelationshipEvidenceItems, buildRelationshipMetadata } from './BrowserFactsPanel.model.shared';
import { formatRelationshipLabel, uniqueSourceRefs } from './BrowserFactsPanel.utils';

export function buildRelationshipFactsPanelModel(
  state: BrowserSessionState,
  relationshipId: string,
  viewpointExplanation: BrowserFactsPanelViewpointExplanation | null,
): BrowserFactsPanelModel | null {
  const index = state.index;
  const payload = state.payload;
  if (!index || !payload) {
    return null;
  }
  const relationship = index.relationshipsById.get(relationshipId);
  if (!relationship) {
    return null;
  }
  const fromEntity = index.entitiesById.get(relationship.fromEntityId) ?? null;
  const toEntity = index.entitiesById.get(relationship.toEntityId) ?? null;
  const relatedDiagnostics = payload.diagnostics.filter((diagnostic) => diagnostic.entityId === relationship.fromEntityId || diagnostic.entityId === relationship.toEntityId);
  const evidenceRelationships = buildRelationshipEvidenceItems(index, relationship);
  const sourceRefs = uniqueSourceRefs([
    ...relationship.sourceRefs,
    ...(fromEntity?.sourceRefs ?? []),
    ...(toEntity?.sourceRefs ?? []),
    ...evidenceRelationships.flatMap((item) => index.relationshipsById.get(item.relationshipId)?.sourceRefs ?? []),
  ]);
  const relationshipMetadata = buildRelationshipMetadata(relationship);
  return {
    title: relationship.label?.trim() || relationship.kind,
    subtitle: formatRelationshipLabel(index, relationship),
    mode: 'relationship',
    badges: [relationship.kind, `${relatedDiagnostics.length} diagnostics`, `${sourceRefs.length} source refs`],
    summary: [
      `From ${fromEntity?.displayName?.trim() || fromEntity?.name || relationship.fromEntityId}`,
      `To ${toEntity?.displayName?.trim() || toEntity?.name || relationship.toEntityId}`,
      fromEntity?.scopeId ? `From scope ${index.scopePathById.get(fromEntity.scopeId) ?? fromEntity.scopeId}` : 'From scope unknown',
      toEntity?.scopeId ? `To scope ${index.scopePathById.get(toEntity.scopeId) ?? toEntity.scopeId}` : 'To scope unknown',
    ],
    diagnostics: relatedDiagnostics,
    sourceRefs,
    relationship,
    relationshipMetadata,
    evidenceRelationships,
    scopeFacts: null,
    entityFacts: null,
    scopeBridge: null,
    viewpointExplanation,
  };
}
