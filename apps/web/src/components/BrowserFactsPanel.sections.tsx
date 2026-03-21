import type { BrowserSessionState } from '../browserSessionStore';
import type { BrowserFactsPanelModel } from './BrowserFactsPanel.types';
import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import { displayScopeName, renderDiagnostic, renderEntityButtonLabel, renderSourceRef, renderViewpointList } from './BrowserFactsPanel.utils';

export function FactsPanelHeader({ model, onClose }: Pick<BrowserFactsPanelProps, 'onClose'> & { model: BrowserFactsPanelModel }) {
  return (
    <>
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
    </>
  );
}

export function FactsPanelActions({ model, state, onTogglePinNode, onIsolateSelection, onRemoveSelection }: Pick<BrowserFactsPanelProps, 'onTogglePinNode' | 'onIsolateSelection' | 'onRemoveSelection'> & { model: BrowserFactsPanelModel; state: BrowserSessionState }) {
  return (
    <div className="browser-facts-panel__actions">
      {model.mode === 'entity' && model.entityFacts ? <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'entity', id: model.entityFacts!.entity.externalId })}>{state.canvasNodes.find((node) => node.kind === 'entity' && node.id === model.entityFacts!.entity.externalId)?.pinned ? 'Unpin entity' : 'Pin entity'}</button> : null}
      {(state.selectedEntityIds.length > 0 || state.focusedElement?.kind === 'scope') ? <button type="button" className="button-secondary" onClick={onIsolateSelection}>Isolate</button> : null}
      {(state.selectedEntityIds.length > 0 || state.focusedElement?.kind === 'scope') ? <button type="button" className="button-secondary" onClick={onRemoveSelection}>Remove from canvas</button> : null}
    </div>
  );
}

export function ViewpointSection({ model, onFocusEntity }: Pick<BrowserFactsPanelProps, 'onFocusEntity'> & { model: BrowserFactsPanelModel }) {
  if (!model.viewpointExplanation) {
    return null;
  }
  return (
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
  );
}

export function ScopeSections({ model, onSelectScope, onFocusEntity, onAddEntities }: Pick<BrowserFactsPanelProps, 'onSelectScope' | 'onFocusEntity' | 'onAddEntities'> & { model: BrowserFactsPanelModel }) {
  if (!model.scopeFacts || !model.scopeBridge) {
    return null;
  }
  return (
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
  );
}

export function EntitySections({ model, onSelectScope, onFocusRelationship }: Pick<BrowserFactsPanelProps, 'onSelectScope' | 'onFocusRelationship'> & { model: BrowserFactsPanelModel }) {
  if (!model.entityFacts) {
    return null;
  }
  return (
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
  );
}

export function RelationshipSections({ model, state, onFocusEntity }: Pick<BrowserFactsPanelProps, 'onFocusEntity'> & { model: BrowserFactsPanelModel; state: BrowserSessionState }) {
  if (!model.relationship) {
    return null;
  }
  return (
    <>
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

      {model.relationshipMetadata ? (
        <section className="browser-facts-panel__section">
          <div className="browser-facts-panel__section-header">
            <h4>Relationship semantics</h4>
          </div>
          <div className="browser-facts-panel__split">
            <div>
              <h5>Normalized</h5>
              {model.relationshipMetadata.normalized.length > 0 ? (
                <ul className="browser-facts-panel__list">
                  {model.relationshipMetadata.normalized.map((entry) => (
                    <li key={`normalized:${entry.key}`} className="browser-facts-panel__list-item">
                      <strong>{entry.label}</strong>
                      <span>{entry.value}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">No normalized relationship metadata.</p>}
            </div>
            <div>
              <h5>Framework evidence</h5>
              {model.relationshipMetadata.evidence.length > 0 ? (
                <ul className="browser-facts-panel__list">
                  {model.relationshipMetadata.evidence.map((entry) => (
                    <li key={`evidence:${entry.key}`} className="browser-facts-panel__list-item">
                      <strong>{entry.label}</strong>
                      <span>{entry.value}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">No framework-specific relationship evidence.</p>}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function DiagnosticsSection({ model }: { model: BrowserFactsPanelModel }) {
  return (
    <section className="browser-facts-panel__section">
      <div className="browser-facts-panel__section-header">
        <h4>Diagnostics</h4>
      </div>
      {model.diagnostics.length > 0 ? <ul className="browser-facts-panel__list">{model.diagnostics.slice(0, 8).map(renderDiagnostic)}</ul> : <p className="muted">No local diagnostics for the current selection.</p>}
    </section>
  );
}

export function SourceRefsSection({ model }: { model: BrowserFactsPanelModel }) {
  return (
    <section className="browser-facts-panel__section">
      <div className="browser-facts-panel__section-header">
        <h4>Source refs</h4>
      </div>
      {model.sourceRefs.length > 0 ? <ul className="browser-facts-panel__list">{model.sourceRefs.slice(0, 8).map(renderSourceRef)}</ul> : <p className="muted">No source references attached to the current selection.</p>}
    </section>
  );
}
