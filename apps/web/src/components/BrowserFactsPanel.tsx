import type { FullSnapshotDiagnostic, FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope, SnapshotSourceRef } from '../appModel';
import {
  getDirectEntitiesForScope,
  getEntityFacts,
  getPrimaryEntitiesForScope,
  getScopeFacts,
  getSubtreeEntitiesForScope,
  getChildScopes,
  type BrowserEntityFacts,
  type BrowserScopeFacts,
  type BrowserSnapshotIndex,
} from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';
import type { BrowserResolvedViewpointGraph } from '../browserSnapshotIndex';

export type BrowserFactsPanelScopeSummary = {
  id: string;
  kind: string;
  name: string;
  path: string;
};

export type BrowserFactsPanelEntitySummary = {
  id: string;
  kind: string;
  name: string;
  scopeId: string | null;
};

export type BrowserFactsPanelEntityGroup = {
  kind: string;
  count: number;
  entityIds: string[];
  sampleEntityIds: string[];
};

export type BrowserFactsPanelScopeBridge = {
  parentScope: BrowserFactsPanelScopeSummary | null;
  childScopes: BrowserFactsPanelScopeSummary[];
  primaryEntities: BrowserFactsPanelEntitySummary[];
  directEntities: BrowserFactsPanelEntitySummary[];
  subtreeEntities: BrowserFactsPanelEntitySummary[];
  directEntityGroups: BrowserFactsPanelEntityGroup[];
  subtreeEntityGroups: BrowserFactsPanelEntityGroup[];
};

export type BrowserFactsPanelViewpointExplanation = {
  viewpointId: string;
  title: string;
  description: string;
  availability: string;
  confidenceLabel: string;
  confidenceBand: string;
  variantLabel: string;
  scopeModeLabel: string;
  scopeLabel: string;
  seedRoleIds: string[];
  expandViaSemantics: string[];
  preferredDependencyViews: string[];
  evidenceSources: string[];
  seedEntities: BrowserFactsPanelEntitySummary[];
  entityCount: number;
  relationshipCount: number;
  recommendedLayout: string;
};

export type BrowserFactsPanelModel = {
  title: string;
  subtitle: string;
  mode: 'overview' | 'scope' | 'entity' | 'relationship';
  badges: string[];
  summary: string[];
  diagnostics: FullSnapshotDiagnostic[];
  sourceRefs: SnapshotSourceRef[];
  relationship: FullSnapshotRelationship | null;
  scopeFacts: BrowserScopeFacts | null;
  entityFacts: BrowserEntityFacts | null;
  scopeBridge: BrowserFactsPanelScopeBridge | null;
  viewpointExplanation: BrowserFactsPanelViewpointExplanation | null;
};

function uniqueSourceRefs(sourceRefs: SnapshotSourceRef[]) {
  const seen = new Set<string>();
  const unique: SnapshotSourceRef[] = [];
  for (const item of sourceRefs) {
    const key = JSON.stringify(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function formatRelationshipLabel(index: BrowserSnapshotIndex, relationship: FullSnapshotRelationship) {
  const fromEntity = index.entitiesById.get(relationship.fromEntityId);
  const toEntity = index.entitiesById.get(relationship.toEntityId);
  const fromName = fromEntity?.displayName?.trim() || fromEntity?.name || relationship.fromEntityId;
  const toName = toEntity?.displayName?.trim() || toEntity?.name || relationship.toEntityId;
  return `${fromName} → ${toName}`;
}

function displayEntityName(entity: FullSnapshotEntity) {
  return entity.displayName?.trim() || entity.name;
}

function displayScopeName(scope: FullSnapshotScope) {
  return scope.displayName?.trim() || scope.name;
}

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


function renderViewpointList(values: string[], emptyText: string) {
  if (values.length === 0) {
    return <p className="muted">{emptyText}</p>;
  }
  return (
    <ul className="browser-facts-panel__list">
      {values.map((value) => (
        <li key={value} className="browser-facts-panel__list-item">{value}</li>
      ))}
    </ul>
  );
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
    scopeFacts: null,
    entityFacts: null,
    scopeBridge: null,
    viewpointExplanation,
  };
}

function renderSourceRef(sourceRef: SnapshotSourceRef, index: number) {
  const segments = [sourceRef.path, sourceRef.startLine ? `line ${sourceRef.startLine}` : null, sourceRef.endLine && sourceRef.endLine !== sourceRef.startLine ? `to ${sourceRef.endLine}` : null].filter(Boolean);
  return <li key={`${sourceRef.path ?? 'ref'}:${index}`}>{segments.join(' • ') || 'Source reference'}</li>;
}

function renderDiagnostic(diagnostic: FullSnapshotDiagnostic) {
  return (
    <li key={diagnostic.externalId} className="browser-facts-panel__list-item">
      <strong>{diagnostic.severity}: {diagnostic.code}</strong>
      <span>{diagnostic.message}</span>
      {diagnostic.filePath ? <span className="muted">{diagnostic.filePath}</span> : null}
    </li>
  );
}

function renderEntityButtonLabel(group: BrowserFactsPanelEntityGroup, scope: 'direct' | 'subtree') {
  if (scope === 'direct') {
    return `Add ${group.kind.toLocaleLowerCase()}${group.count === 1 ? '' : 's'}`;
  }
  return `Add subtree ${group.kind.toLocaleLowerCase()}${group.count === 1 ? '' : 's'}`;
}

export type BrowserFactsPanelProps = {
  state: BrowserSessionState;
  onSelectScope: (scopeId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
  onFocusRelationship: (relationshipId: string) => void;
  onAddEntities: (entityIds: string[]) => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onIsolateSelection: () => void;
  onRemoveSelection: () => void;
  onClose: () => void;
};

export function BrowserFactsPanel({ state, onSelectScope, onFocusEntity, onFocusRelationship, onAddEntities, onTogglePinNode, onIsolateSelection, onRemoveSelection, onClose }: BrowserFactsPanelProps) {
  const model = buildBrowserFactsPanelModel(state);

  if (!model) {
    return (
      <section className="card browser-facts-panel browser-facts-panel--empty">
        <p className="eyebrow">Facts</p>
        <h3>No local facts available</h3>
        <p className="muted">Prepare a snapshot and select a scope or canvas element to inspect local details.</p>
      </section>
    );
  }

  return (
    <section className="card browser-facts-panel" aria-label="Browser facts and details panel">
      <div className="browser-facts-panel__header">
        <div>
          <p className="eyebrow">Facts panel</p>
          <h3>{model.title}</h3>
          <p className="muted">{model.subtitle}</p>
        </div>
        <button type="button" className="button-secondary" onClick={onClose}>Hide</button>
      </div>

      <div className="browser-facts-panel__badges">
        {model.badges.map((badge) => <span key={badge} className="badge">{badge}</span>)}
      </div>

      <div className="browser-facts-panel__actions">
        {model.mode === 'entity' && model.entityFacts ? <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'entity', id: model.entityFacts!.entity.externalId })}>{state.canvasNodes.find((node) => node.kind === 'entity' && node.id === model.entityFacts!.entity.externalId)?.pinned ? 'Unpin entity' : 'Pin entity'}</button> : null}
        {(state.selectedEntityIds.length > 0 || state.focusedElement?.kind === 'scope') ? <button type="button" className="button-secondary" onClick={onIsolateSelection}>Isolate</button> : null}
        {(state.selectedEntityIds.length > 0 || state.focusedElement?.kind === 'scope') ? <button type="button" className="button-secondary" onClick={onRemoveSelection}>Remove from canvas</button> : null}
      </div>

      <div className="browser-facts-panel__summary">
        {model.summary.map((line) => <p key={line} className="muted">{line}</p>)}
      </div>

      {model.viewpointExplanation ? (
        <section className="browser-facts-panel__section">
          <div className="browser-facts-panel__section-header">
            <h4>Applied viewpoint</h4>
          </div>
          <div className="browser-count-grid browser-count-grid--facts">
            <div><strong>{model.viewpointExplanation.availability}</strong><span>Availability</span></div>
            <div><strong>{model.viewpointExplanation.confidenceLabel}</strong><span>Confidence</span></div>
            <div><strong>{model.viewpointExplanation.confidenceBand}</strong><span>Confidence band</span></div>
            <div><strong>{model.viewpointExplanation.variantLabel}</strong><span>Variant</span></div>
            <div><strong>{model.viewpointExplanation.entityCount}</strong><span>Entities</span></div>
            <div><strong>{model.viewpointExplanation.relationshipCount}</strong><span>Relationships</span></div>
          </div>
          <div className="browser-facts-panel__summary">
            <p className="muted">{model.viewpointExplanation.title} ({model.viewpointExplanation.viewpointId})</p>
            <p className="muted">{model.viewpointExplanation.description}</p>
            <p className="muted">Applied to {model.viewpointExplanation.scopeModeLabel}: {model.viewpointExplanation.scopeLabel}</p>
            <p className="muted">Recommended layout {model.viewpointExplanation.recommendedLayout}</p>
          </div>

          <div className="browser-facts-panel__split">
            <div>
              <h5>Seed entities</h5>
              {model.viewpointExplanation.seedEntities.length > 0 ? (
                <ul className="browser-facts-panel__list">
                  {model.viewpointExplanation.seedEntities.slice(0, 8).map((entity) => (
                    <li key={entity.id} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                      <button type="button" className="button-secondary" onClick={() => onFocusEntity(entity.id)}>{entity.name}</button>
                      <span>{entity.kind}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">No explicit seed entities were resolved for the applied viewpoint.</p>}
            </div>
            <div>
              <h5>Seed roles</h5>
              {renderViewpointList(model.viewpointExplanation.seedRoleIds, 'No seed roles defined for the applied viewpoint.')}
              <h5>Expansion semantics</h5>
              {renderViewpointList(model.viewpointExplanation.expandViaSemantics, 'No expansion semantics defined for the applied viewpoint.')}
            </div>
          </div>

          <div className="browser-facts-panel__split">
            <div>
              <h5>Preferred dependency views</h5>
              {renderViewpointList(model.viewpointExplanation.preferredDependencyViews, 'No preferred dependency views exported for the applied viewpoint.')}
            </div>
            <div>
              <h5>Evidence sources</h5>
              {renderViewpointList(model.viewpointExplanation.evidenceSources, 'No evidence sources exported for the applied viewpoint.')}
            </div>
          </div>
        </section>
      ) : null}

      {model.scopeFacts && model.scopeBridge ? (
        <>
          <section className="browser-facts-panel__section">
            <div className="browser-facts-panel__section-header">
              <h4>Scope</h4>
              <button type="button" className="button-secondary" onClick={() => onSelectScope(model.scopeFacts?.scope.externalId ?? null)}>Select scope</button>
            </div>
            <div className="browser-count-grid browser-count-grid--facts">
              <div><strong>{model.scopeFacts.scope.kind}</strong><span>Kind</span></div>
              <div><strong>{model.scopeBridge.parentScope ? 'Yes' : 'No'}</strong><span>Has parent</span></div>
              <div><strong>{model.scopeBridge.childScopes.length}</strong><span>Child scopes</span></div>
              <div><strong>{model.scopeFacts.descendantScopeCount}</strong><span>Descendant scopes</span></div>
            </div>
            <div className="browser-facts-panel__summary">
              <p className="muted">Display {displayScopeName(model.scopeFacts.scope)}</p>
              <p className="muted">Path {model.scopeFacts.path}</p>
              <p className="muted">Parent {model.scopeBridge.parentScope?.path ?? 'Root scope'}</p>
            </div>
          </section>

          <section className="browser-facts-panel__section">
            <div className="browser-facts-panel__section-header">
              <h4>Primary entities</h4>
              {model.scopeBridge.primaryEntities.length > 0 ? (
                <button type="button" className="button-secondary" onClick={() => onAddEntities(model.scopeBridge!.primaryEntities.map((entity) => entity.id))}>Add primary</button>
              ) : null}
            </div>
            {model.scopeBridge.primaryEntities.length > 0 ? (
              <ul className="browser-facts-panel__list">
                {model.scopeBridge.primaryEntities.map((entity) => (
                  <li key={entity.id} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onFocusEntity(entity.id)}>{entity.name}</button>
                    <span>{entity.kind}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No primary entities resolved for this scope.</p>}
          </section>

          <section className="browser-facts-panel__section">
            <div className="browser-facts-panel__section-header">
              <h4>Direct entities by kind</h4>
              {model.scopeBridge.directEntities.length > 0 ? (
                <button type="button" className="button-secondary" onClick={() => onAddEntities(model.scopeBridge!.directEntities.map((entity) => entity.id))}>Add all direct</button>
              ) : null}
            </div>
            {model.scopeBridge.directEntityGroups.length > 0 ? (
              <ul className="browser-facts-panel__list">
                {model.scopeBridge.directEntityGroups.map((group) => (
                  <li key={`direct:${group.kind}`} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onAddEntities(group.entityIds)}>{renderEntityButtonLabel(group, 'direct')}</button>
                    <span>{group.kind} ({group.count})</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No direct entities in this scope.</p>}
          </section>

          <section className="browser-facts-panel__section">
            <div className="browser-facts-panel__section-header">
              <h4>Subtree entities by kind</h4>
              {model.scopeBridge.subtreeEntities.length > 0 ? (
                <button type="button" className="button-secondary" onClick={() => onAddEntities(model.scopeBridge!.subtreeEntities.map((entity) => entity.id))}>Add all subtree</button>
              ) : null}
            </div>
            {model.scopeBridge.subtreeEntityGroups.length > 0 ? (
              <ul className="browser-facts-panel__list">
                {model.scopeBridge.subtreeEntityGroups.map((group) => (
                  <li key={`subtree:${group.kind}`} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onAddEntities(group.entityIds)}>{renderEntityButtonLabel(group, 'subtree')}</button>
                    <span>{group.kind} ({group.count})</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No subtree entities under this scope.</p>}
          </section>

          <section className="browser-facts-panel__section">
            <div className="browser-facts-panel__section-header">
              <h4>Child scopes</h4>
            </div>
            {model.scopeBridge.childScopes.length > 0 ? (
              <ul className="browser-facts-panel__list">
                {model.scopeBridge.childScopes.slice(0, 8).map((scope) => (
                  <li key={scope.id} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onSelectScope(scope.id)}>{scope.name}</button>
                    <span>{scope.kind}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No child scopes under the current selection.</p>}
          </section>
        </>
      ) : null}

      {model.entityFacts ? (
        <section className="browser-facts-panel__section">
          <div className="browser-facts-panel__section-header">
            <h4>Relationship context</h4>
            {model.entityFacts.scope ? <button type="button" className="button-secondary" onClick={() => onSelectScope(model.entityFacts?.scope?.externalId ?? null)}>Open scope</button> : null}
          </div>
          <div className="browser-facts-panel__split">
            <div>
              <h5>Inbound</h5>
              <ul className="browser-facts-panel__list">
                {model.entityFacts.inboundRelationships.slice(0, 8).map((relationship) => (
                  <li key={relationship.externalId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onFocusRelationship(relationship.externalId)}>{relationship.label?.trim() || relationship.kind}</button>
                    <span>{relationship.fromEntityId} → {relationship.toEntityId}</span>
                  </li>
                ))}
                {model.entityFacts.inboundRelationships.length === 0 ? <li className="muted">No inbound relationships.</li> : null}
              </ul>
            </div>
            <div>
              <h5>Outbound</h5>
              <ul className="browser-facts-panel__list">
                {model.entityFacts.outboundRelationships.slice(0, 8).map((relationship) => (
                  <li key={relationship.externalId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onFocusRelationship(relationship.externalId)}>{relationship.label?.trim() || relationship.kind}</button>
                    <span>{relationship.fromEntityId} → {relationship.toEntityId}</span>
                  </li>
                ))}
                {model.entityFacts.outboundRelationships.length === 0 ? <li className="muted">No outbound relationships.</li> : null}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {model.relationship ? (
        <section className="browser-facts-panel__section">
          <div className="browser-facts-panel__section-header">
            <h4>Connected entities</h4>
          </div>
          <ul className="browser-facts-panel__list">
            {[model.relationship.fromEntityId, model.relationship.toEntityId].map((entityId) => {
              const entity = state.index?.entitiesById.get(entityId);
              return (
                <li key={entityId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                  <button type="button" className="button-secondary" onClick={() => onFocusEntity(entityId)}>{entity?.displayName?.trim() || entity?.name || entityId}</button>
                  <span>{entity?.kind ?? 'ENTITY'}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="browser-facts-panel__section">
        <div className="browser-facts-panel__section-header">
          <h4>Diagnostics</h4>
        </div>
        {model.diagnostics.length > 0 ? <ul className="browser-facts-panel__list">{model.diagnostics.slice(0, 8).map(renderDiagnostic)}</ul> : <p className="muted">No local diagnostics for the current selection.</p>}
      </section>

      <section className="browser-facts-panel__section">
        <div className="browser-facts-panel__section-header">
          <h4>Source refs</h4>
        </div>
        {model.sourceRefs.length > 0 ? <ul className="browser-facts-panel__list">{model.sourceRefs.slice(0, 8).map(renderSourceRef)}</ul> : <p className="muted">No source references attached to the current selection.</p>}
      </section>
    </section>
  );
}
