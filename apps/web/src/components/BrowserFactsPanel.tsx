import type { FullSnapshotDiagnostic, FullSnapshotRelationship, SnapshotSourceRef } from '../appModel';
import {
  getEntityFacts,
  getScopeFacts,
  type BrowserEntityFacts,
  type BrowserScopeFacts,
  type BrowserSnapshotIndex,
} from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';

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

export function buildBrowserFactsPanelModel(state: BrowserSessionState): BrowserFactsPanelModel | null {
  const index = state.index;
  const payload = state.payload;
  if (!index || !payload) {
    return null;
  }

  const selectedScopeId = state.selectedScopeId;
  const focused = state.focusedElement;

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
    };
  }

  if (focused?.kind === 'entity') {
    const entityFacts = getEntityFacts(index, focused.id);
    if (!entityFacts) {
      return null;
    }
    return {
      title: entityFacts.entity.displayName?.trim() || entityFacts.entity.name,
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
    };
  }

  if (focused?.kind === 'scope' || selectedScopeId) {
    const scopeId = focused?.kind === 'scope' ? focused.id : selectedScopeId;
    const scopeFacts = scopeId ? getScopeFacts(index, scopeId) : null;
    if (!scopeFacts) {
      return null;
    }
    return {
      title: scopeFacts.scope.displayName?.trim() || scopeFacts.scope.name,
      subtitle: [scopeFacts.scope.kind, scopeFacts.path].filter(Boolean).join(' • '),
      mode: 'scope',
      badges: [
        `${scopeFacts.childScopeIds.length} children`,
        `${scopeFacts.entityIds.length} direct entities`,
        `${scopeFacts.descendantEntityCount} subtree entities`,
        `${scopeFacts.diagnostics.length} diagnostics`,
      ],
      summary: [
        scopeFacts.scope.externalId,
        `Descendant scopes ${scopeFacts.descendantScopeCount}`,
        `Source refs ${scopeFacts.sourceRefs.length}`,
      ],
      diagnostics: scopeFacts.diagnostics,
      sourceRefs: scopeFacts.sourceRefs,
      relationship: null,
      scopeFacts,
      entityFacts: null,
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

export type BrowserFactsPanelProps = {
  state: BrowserSessionState;
  onSelectScope: (scopeId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
  onFocusRelationship: (relationshipId: string) => void;
  onClose: () => void;
};

export function BrowserFactsPanel({ state, onSelectScope, onFocusEntity, onFocusRelationship, onClose }: BrowserFactsPanelProps) {
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

      <div className="browser-facts-panel__summary">
        {model.summary.map((line) => <p key={line} className="muted">{line}</p>)}
      </div>

      {model.scopeFacts ? (
        <section className="browser-facts-panel__section">
          <div className="browser-facts-panel__section-header">
            <h4>Scope details</h4>
            <button type="button" className="button-secondary" onClick={() => onSelectScope(model.scopeFacts?.scope.externalId ?? null)}>Select scope</button>
          </div>
          <div className="browser-count-grid browser-count-grid--facts">
            <div><strong>{model.scopeFacts.childScopeIds.length}</strong><span>Child scopes</span></div>
            <div><strong>{model.scopeFacts.entityIds.length}</strong><span>Direct entities</span></div>
            <div><strong>{model.scopeFacts.descendantScopeCount}</strong><span>Descendant scopes</span></div>
            <div><strong>{model.scopeFacts.descendantEntityCount}</strong><span>Descendant entities</span></div>
          </div>
          {model.scopeFacts.entityIds.length > 0 ? (
            <ul className="browser-facts-panel__list">
              {model.scopeFacts.entityIds.slice(0, 8).map((entityId) => {
                const entity = state.index?.entitiesById.get(entityId);
                return (
                  <li key={entityId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                    <button type="button" className="button-secondary" onClick={() => onFocusEntity(entityId)}>{entity?.displayName?.trim() || entity?.name || entityId}</button>
                    <span>{entity?.kind ?? 'ENTITY'}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
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
