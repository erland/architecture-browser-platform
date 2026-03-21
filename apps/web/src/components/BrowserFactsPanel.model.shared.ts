import type { FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope } from '../appModel';
import type {
  BrowserResolvedViewpointGraph,
  BrowserSnapshotIndex,
} from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';
import type {
  BrowserFactsPanelEntityGroup,
  BrowserFactsPanelEntitySummary,
  BrowserFactsPanelRelationshipMetadata,
  BrowserFactsPanelRelationshipMetadataEntry,
  BrowserFactsPanelScopeSummary,
  BrowserFactsPanelViewpointExplanation,
} from './BrowserFactsPanel.types';
import { displayEntityName, displayScopeName } from './BrowserFactsPanel.utils';

export function toEntitySummary(entity: FullSnapshotEntity): BrowserFactsPanelEntitySummary {
  return {
    id: entity.externalId,
    kind: entity.kind,
    name: displayEntityName(entity),
    scopeId: entity.scopeId,
  };
}

export function toScopeSummary(index: BrowserSnapshotIndex, scope: FullSnapshotScope): BrowserFactsPanelScopeSummary {
  return {
    id: scope.externalId,
    kind: scope.kind,
    name: displayScopeName(scope),
    path: index.scopePathById.get(scope.externalId) ?? displayScopeName(scope),
  };
}

export function formatRelationshipMetadataLabel(key: string) {
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

export function buildRelationshipMetadata(relationship: FullSnapshotRelationship): BrowserFactsPanelRelationshipMetadata | null {
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

export function buildEntityGroups(entities: FullSnapshotEntity[]): BrowserFactsPanelEntityGroup[] {
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

export function formatConfidenceBand(confidence: number) {
  if (confidence >= 0.85) {
    return 'High';
  }
  if (confidence >= 0.6) {
    return 'Medium';
  }
  return 'Low';
}

export function formatConfidenceLabel(confidence: number) {
  const percent = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  if (percent >= 85) {
    return `High (${percent}%)`;
  }
  if (percent >= 60) {
    return `Medium (${percent}%)`;
  }
  return `Low (${percent}%)`;
}

export function formatScopeModeLabel(scopeMode: BrowserResolvedViewpointGraph['scopeMode']) {
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

export function buildViewpointExplanation(state: BrowserSessionState): BrowserFactsPanelViewpointExplanation | null {
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
