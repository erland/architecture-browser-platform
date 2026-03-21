import type { FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope } from '../appModel';
import {
  getDirectEntitiesForScope,
  getEntityFacts,
  getPrimaryEntitiesForScope,
  getScopeFacts,
  getSubtreeEntitiesForScope,
  getChildScopes,
  type BrowserScopeFacts,
  type BrowserSnapshotIndex,
  type BrowserResolvedViewpointGraph,
} from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';
import type {
  BrowserFactsPanelEntityGroup,
  BrowserFactsPanelEntitySummary,
  BrowserFactsPanelModel,
  BrowserFactsPanelRelationshipMetadata,
  BrowserFactsPanelRelationshipMetadataEntry,
  BrowserFactsPanelScopeBridge,
  BrowserFactsPanelScopeSummary,
  BrowserFactsPanelViewpointExplanation,
} from './BrowserFactsPanel.types';
import { displayEntityName, displayScopeName, formatRelationshipLabel, uniqueSourceRefs } from './BrowserFactsPanel.utils';

function toEntitySummary(entity: FullSnapshotEntity): BrowserFactsPanelEntitySummary {
  return {
    id: entity.externalId,
    kind: entity.kind,
    name: displayEntityName(entity),
    scopeId: entity.scopeId,
  };
}

function toScopeSummary(index: BrowserSnapshotIndex, scope: FullSnapshotScope): BrowserFactsPanelScopeSummary {
  return {
    id: scope.externalId,
    kind: scope.kind,
    name: displayScopeName(scope),
    path: index.scopePathById.get(scope.externalId) ?? displayScopeName(scope),
  };
}

function formatRelationshipMetadataLabel(key: string) {
  switch (key) {
    case 'associationKind':
      return 'Association kind';
    case 'associationCardinality':
      return 'Association cardinality';
    case 'sourceLowerBound':
      return 'Source lower bound';
    case 'sourceUpperBound':
      return 'Source upper bound';
    case 'targetLowerBound':
      return 'Target lower bound';
    case 'targetUpperBound':
      return 'Target upper bound';
    case 'jpaAssociation':
      return 'JPA association';
    case 'joinColumn':
      return 'Join column';
    case 'joinTable':
      return 'Join table';
    case 'mappedBy':
      return 'Mapped by';
    default:
      return key;
  }
}

function buildRelationshipMetadata(relationship: FullSnapshotRelationship): BrowserFactsPanelRelationshipMetadata | null {
  const metadata = (relationship.metadata ?? {}) as Record<string, unknown>;
  const nested = metadata.metadata && typeof metadata.metadata === 'object' && !Array.isArray(metadata.metadata)
    ? (metadata.metadata as Record<string, unknown>)
    : null;

  const readValue = (key: string): string | null => {
    const direct = metadata[key];
    if (direct !== undefined && direct !== null) {
      const value = String(direct).trim();
      if (value.length > 0) {
        return value;
      }
    }
    if (nested) {
      const nestedValue = nested[key];
      if (nestedValue !== undefined && nestedValue !== null) {
        const value = String(nestedValue).trim();
        if (value.length > 0) {
          return value;
        }
      }
    }
    return null;
  };

  const normalizedKeys = [
    'associationKind',
    'associationCardinality',
    'sourceLowerBound',
    'sourceUpperBound',
    'targetLowerBound',
    'targetUpperBound',
  ] as const;
  const normalized: BrowserFactsPanelRelationshipMetadataEntry[] = [];
  for (const key of normalizedKeys) {
    const value = readValue(key);
    if (value) {
      normalized.push({ key, label: formatRelationshipMetadataLabel(key), value });
    }
  }

  const evidenceKeys = ['jpaAssociation', 'joinColumn', 'joinTable', 'mappedBy'] as const;
  const evidence: BrowserFactsPanelRelationshipMetadataEntry[] = [];
  for (const key of evidenceKeys) {
    const value = readValue(key);
    if (value) {
      evidence.push({ key, label: formatRelationshipMetadataLabel(key), value });
    }
  }

  if (normalized.length === 0 && evidence.length === 0) {
    return null;
  }
  return { normalized, evidence };
}

function buildEntityGroups(entities: FullSnapshotEntity[]): BrowserFactsPanelEntityGroup[] {
  const grouped = new Map<string, BrowserFactsPanelEntityGroup>();
  for (const entity of entities) {
    const current = grouped.get(entity.kind);
    if (current) {
      current.count += 1;
      current.entityIds.push(entity.externalId);
      if (current.sampleEntityIds.length < 5) {
        current.sampleEntityIds.push(entity.externalId);
      }
      continue;
    }
    grouped.set(entity.kind, {
      kind: entity.kind,
      count: 1,
      entityIds: [entity.externalId],
      sampleEntityIds: [entity.externalId],
    });
  }
  return [...grouped.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return left.kind.localeCompare(right.kind, undefined, { sensitivity: 'base' });
  });
}

function buildScopeBridge(index: BrowserSnapshotIndex, scopeFacts: BrowserScopeFacts): BrowserFactsPanelScopeBridge {
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

function formatConfidenceBand(confidence: number) {
  if (confidence >= 0.85) {
    return 'High';
  }
  if (confidence >= 0.6) {
    return 'Medium';
  }
  return 'Low';
}

function formatConfidenceLabel(confidence: number) {
  const percent = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  if (percent >= 85) {
    return `High (${percent}%)`;
  }
  if (percent >= 60) {
    return `Medium (${percent}%)`;
  }
  return `Low (${percent}%)`;
}

function formatScopeModeLabel(scopeMode: BrowserResolvedViewpointGraph['scopeMode']) {
  switch (scopeMode) {
    case 'selected-scope':
      return 'Current scope';
    case 'selected-subtree':
      return 'Current subtree';
    case 'whole-snapshot':
      return 'Whole snapshot';
    default:
      return scopeMode;
  }
}

function buildViewpointExplanation(state: BrowserSessionState): BrowserFactsPanelViewpointExplanation | null {
  const index = state.index;
  const appliedViewpoint = state.appliedViewpoint;
  if (!index || !appliedViewpoint) {
    return null;
  }
  const selectedScope = appliedViewpoint.selectedScopeId ? index.scopesById.get(appliedViewpoint.selectedScopeId) ?? null : null;
  return {
    viewpointId: appliedViewpoint.viewpoint.id,
    title: appliedViewpoint.viewpoint.title,
    description: appliedViewpoint.viewpoint.description,
    availability: appliedViewpoint.viewpoint.availability,
    confidenceLabel: formatConfidenceLabel(appliedViewpoint.viewpoint.confidence),
    confidenceBand: formatConfidenceBand(appliedViewpoint.viewpoint.confidence),
    variantLabel: (appliedViewpoint.variant ?? 'default').replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    scopeModeLabel: formatScopeModeLabel(appliedViewpoint.scopeMode),
    scopeLabel: selectedScope ? (index.scopePathById.get(selectedScope.externalId) ?? displayScopeName(selectedScope)) : 'Whole snapshot',
    seedRoleIds: [...appliedViewpoint.viewpoint.seedRoleIds],
    expandViaSemantics: [...appliedViewpoint.viewpoint.expandViaSemantics],
    preferredDependencyViews: [...appliedViewpoint.preferredDependencyViews],
    evidenceSources: [...appliedViewpoint.viewpoint.evidenceSources],
    seedEntities: appliedViewpoint.seedEntityIds
      .map((entityId) => index.entitiesById.get(entityId))
      .filter((entity): entity is FullSnapshotEntity => Boolean(entity))
      .map(toEntitySummary),
    entityCount: Math.max(
      appliedViewpoint.entityIds.length,
      appliedViewpoint.seedEntityIds.length,
      state.canvasNodes.filter((node) => node.kind === 'entity').length,
    ),
    relationshipCount: appliedViewpoint.relationshipIds.length,
    recommendedLayout: appliedViewpoint.recommendedLayout,
  };
}

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
    const relationship = index.relationshipsById.get(focused.id);
    if (!relationship) {
      return null;
    }
    const fromEntity = index.entitiesById.get(relationship.fromEntityId) ?? null;
    const toEntity = index.entitiesById.get(relationship.toEntityId) ?? null;
    const relatedDiagnostics = payload.diagnostics.filter((diagnostic) => diagnostic.entityId === relationship.fromEntityId || diagnostic.entityId === relationship.toEntityId);
    const sourceRefs = uniqueSourceRefs([
      ...relationship.sourceRefs,
      ...(fromEntity?.sourceRefs ?? []),
      ...(toEntity?.sourceRefs ?? []),
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
      scopeFacts: null,
      entityFacts: null,
      scopeBridge: null,
      viewpointExplanation,
    };
  }

  if (focused?.kind === 'entity') {
    const entityFacts = getEntityFacts(index, focused.id);
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
      scopeFacts: null,
      entityFacts,
      scopeBridge: null,
      viewpointExplanation,
    };
  }

  if (focused?.kind === 'scope' || selectedScopeId) {
    const scopeId = focused?.kind === 'scope' ? focused.id : selectedScopeId;
    const scopeFacts = scopeId ? getScopeFacts(index, scopeId) : null;
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

  return {
    title: payload.snapshot.snapshotKey,
    subtitle: 'Prepared local snapshot overview',
    mode: 'overview',
    badges: [
      `${payload.scopes.length} scopes`,
      `${payload.entities.length} entities`,
      `${payload.relationships.length} relationships`,
      `${payload.diagnostics.length} diagnostics`,
    ],
    summary: [
      `Workspace ${payload.snapshot.workspaceId}`,
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
