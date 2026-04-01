import type {
  BrowserFactsPanelActionsModel,
  BrowserFactsPanelDiagnosticsSectionModel,
  BrowserFactsPanelEntitySectionModel,
  BrowserFactsPanelHeaderModel,
  BrowserFactsPanelRelationshipSectionModel,
  BrowserFactsPanelScopeSectionModel,
  BrowserFactsPanelSourceRefsSectionModel,
  BrowserFactsPanelViewpointSectionModel,
} from './BrowserFactsPanel.types';
import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import { renderDiagnostic, renderEntityButtonLabel, renderSourceRef, renderViewpointList } from './BrowserFactsPanel.utils';

export function FactsPanelHeader({ header, onClose }: Pick<BrowserFactsPanelProps, 'onClose'> & { header: BrowserFactsPanelHeaderModel }) {
  return (
    <>
      <div className="browser-facts-panel__header">
        <div>
          <p className="eyebrow">Facts panel</p>
          <h3>{header.title}</h3>
          <p className="muted">{header.subtitle}</p>
        </div>
        <button type="button" className="button-secondary" onClick={onClose}>Hide</button>
      </div>

      <div className="browser-facts-panel__badges">
        {header.badges.map((badge) => <span key={badge} className="badge">{badge}</span>)}
      </div>

      <div className="browser-facts-panel__summary">
        {header.summary.map((line) => <p key={line} className="muted">{line}</p>)}
      </div>
    </>
  );
}

export function FactsPanelActions({ actions, onTogglePinNode, onIsolateSelection, onRemoveSelection }: Pick<BrowserFactsPanelProps, 'onTogglePinNode' | 'onIsolateSelection' | 'onRemoveSelection'> & { actions: BrowserFactsPanelActionsModel }) {
  return (
    <div className="browser-facts-panel__actions">
      {actions.pinEntityAction ? <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'entity', id: actions.pinEntityAction!.entityId })}>{actions.pinEntityAction.label}</button> : null}
      {actions.canIsolateSelection ? <button type="button" className="button-secondary" onClick={onIsolateSelection}>Isolate</button> : null}
      {actions.canRemoveSelection ? <button type="button" className="button-secondary" onClick={onRemoveSelection}>Remove from canvas</button> : null}
    </div>
  );
}

export function ViewpointSection({ section, onFocusEntity }: Pick<BrowserFactsPanelProps, 'onFocusEntity'> & { section: BrowserFactsPanelViewpointSectionModel | null }) {
  if (!section) {
    return null;
  }
  return (
    <section className="browser-facts-panel__section">
      <div className="browser-facts-panel__section-header">
        <h4>Applied viewpoint</h4>
      </div>
      <div className="browser-count-grid browser-count-grid--facts">
        {section.metrics.map((metric) => (
          <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>
        ))}
      </div>
      <div className="browser-facts-panel__summary">
        <p className="muted">{section.title} ({section.viewpointId})</p>
        <p className="muted">{section.description}</p>
        <p className="muted">Applied to {section.scopeModeLabel}: {section.scopeLabel}</p>
        <p className="muted">Recommended layout {section.recommendedLayout}</p>
      </div>

      <div className="browser-facts-panel__split">
        <div>
          <h5>Seed entities</h5>
          {section.seedEntities.length > 0 ? (
            <ul className="browser-facts-panel__list">
              {section.seedEntities.slice(0, 8).map((entity) => (
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
          {renderViewpointList(section.seedRoleIds, 'No seed roles defined for the applied viewpoint.')}
          <h5>Expansion semantics</h5>
          {renderViewpointList(section.expandViaSemantics, 'No expansion semantics defined for the applied viewpoint.')}
        </div>
      </div>

      <div className="browser-facts-panel__split">
        <div>
          <h5>Preferred dependency views</h5>
          {renderViewpointList(section.preferredDependencyViews, 'No preferred dependency views exported for the applied viewpoint.')}
        </div>
        <div>
          <h5>Evidence sources</h5>
          {renderViewpointList(section.evidenceSources, 'No evidence sources exported for the applied viewpoint.')}
        </div>
      </div>
    </section>
  );
}

export function ScopeSections({ section, onSelectScope, onFocusEntity, onAddEntities }: Pick<BrowserFactsPanelProps, 'onSelectScope' | 'onFocusEntity' | 'onAddEntities'> & { section: BrowserFactsPanelScopeSectionModel | null }) {
  if (!section) {
    return null;
  }
  const { scopeFacts, bridge } = section;
  return (
    <>
      <section className="browser-facts-panel__section">
        <div className="browser-facts-panel__section-header">
          <h4>Scope</h4>
          <button type="button" className="button-secondary" onClick={() => onSelectScope(scopeFacts.scope.externalId ?? null)}>Select scope</button>
        </div>
        <div className="browser-count-grid browser-count-grid--facts">
          {section.metrics.map((metric) => (
            <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>
          ))}
        </div>
        <div className="browser-facts-panel__summary">
          {section.summary.map((line) => <p key={line} className="muted">{line}</p>)}
        </div>
      </section>

      <section className="browser-facts-panel__section">
        <div className="browser-facts-panel__section-header">
          <h4>Primary entities</h4>
          {bridge.primaryEntities.length > 0 ? (
            <button type="button" className="button-secondary" onClick={() => onAddEntities(bridge.primaryEntities.map((entity) => entity.id))}>Add primary</button>
          ) : null}
        </div>
        {bridge.primaryEntities.length > 0 ? (
          <ul className="browser-facts-panel__list">
            {bridge.primaryEntities.map((entity) => (
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
          {bridge.directEntities.length > 0 ? (
            <button type="button" className="button-secondary" onClick={() => onAddEntities(bridge.directEntities.map((entity) => entity.id))}>Add all direct</button>
          ) : null}
        </div>
        {bridge.directEntityGroups.length > 0 ? (
          <ul className="browser-facts-panel__list">
            {bridge.directEntityGroups.map((group) => (
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
          {bridge.subtreeEntities.length > 0 ? (
            <button type="button" className="button-secondary" onClick={() => onAddEntities(bridge.subtreeEntities.map((entity) => entity.id))}>Add all subtree</button>
          ) : null}
        </div>
        {bridge.subtreeEntityGroups.length > 0 ? (
          <ul className="browser-facts-panel__list">
            {bridge.subtreeEntityGroups.map((group) => (
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
        {bridge.childScopes.length > 0 ? (
          <ul className="browser-facts-panel__list">
            {bridge.childScopes.slice(0, 8).map((scope) => (
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

export function EntitySections({ section, onSelectScope, onFocusRelationship }: Pick<BrowserFactsPanelProps, 'onSelectScope' | 'onFocusRelationship'> & { section: BrowserFactsPanelEntitySectionModel | null }) {
  if (!section) {
    return null;
  }
  return (
    <section className="browser-facts-panel__section">
      <div className="browser-facts-panel__section-header">
        <h4>Relationship context</h4>
        {section.scopeId ? <button type="button" className="button-secondary" onClick={() => onSelectScope(section.scopeId)}>Open scope</button> : null}
      </div>
      <div className="browser-facts-panel__split">
        <div>
          <h5>Inbound</h5>
          <ul className="browser-facts-panel__list">
            {section.inboundRelationships.map((relationship) => (
              <li key={relationship.externalId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                <button type="button" className="button-secondary" onClick={() => onFocusRelationship(relationship.externalId)}>{relationship.label?.trim() || relationship.kind}</button>
                <span>{relationship.fromEntityId} → {relationship.toEntityId}</span>
              </li>
            ))}
            {section.entityFacts.inboundRelationships.length === 0 ? <li className="muted">No inbound relationships.</li> : null}
          </ul>
        </div>
        <div>
          <h5>Outbound</h5>
          <ul className="browser-facts-panel__list">
            {section.outboundRelationships.map((relationship) => (
              <li key={relationship.externalId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                <button type="button" className="button-secondary" onClick={() => onFocusRelationship(relationship.externalId)}>{relationship.label?.trim() || relationship.kind}</button>
                <span>{relationship.fromEntityId} → {relationship.toEntityId}</span>
              </li>
            ))}
            {section.entityFacts.outboundRelationships.length === 0 ? <li className="muted">No outbound relationships.</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function RelationshipSections({ section, onFocusEntity }: Pick<BrowserFactsPanelProps, 'onFocusEntity'> & { section: BrowserFactsPanelRelationshipSectionModel | null }) {
  if (!section) {
    return null;
  }
  return (
    <>
      <section className="browser-facts-panel__section">
        <div className="browser-facts-panel__section-header">
          <h4>Connected entities</h4>
        </div>
        <ul className="browser-facts-panel__list">
          {section.connectedEntities.map((entity) => (
            <li key={entity.id} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
              <button type="button" className="button-secondary" onClick={() => onFocusEntity(entity.id)}>{entity.label}</button>
              <span>{entity.kind}</span>
            </li>
          ))}
        </ul>
      </section>

      {section.metadata ? (
        <section className="browser-facts-panel__section">
          <div className="browser-facts-panel__section-header">
            <h4>Relationship semantics</h4>
          </div>
          <div className="browser-facts-panel__split">
            <div>
              <h5>Normalized</h5>
              {section.metadata.normalized.length > 0 ? (
                <ul className="browser-facts-panel__list">
                  {section.metadata.normalized.map((entry) => (
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
              {section.metadata.evidence.length > 0 ? (
                <ul className="browser-facts-panel__list">
                  {section.metadata.evidence.map((entry) => (
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

export function DiagnosticsSection({ section }: { section: BrowserFactsPanelDiagnosticsSectionModel }) {
  return (
    <section className="browser-facts-panel__section">
      <div className="browser-facts-panel__section-header">
        <h4>Diagnostics</h4>
      </div>
      {section.diagnostics.length > 0 ? <ul className="browser-facts-panel__list">{section.diagnostics.map(renderDiagnostic)}</ul> : <p className="muted">No local diagnostics for the current selection.</p>}
    </section>
  );
}

export function SourceRefsSection({ section }: { section: BrowserFactsPanelSourceRefsSectionModel }) {
  return (
    <section className="browser-facts-panel__section">
      <div className="browser-facts-panel__section-header">
        <h4>Source refs</h4>
      </div>
      {section.sourceRefs.length > 0 ? <ul className="browser-facts-panel__list">{section.sourceRefs.map(renderSourceRef)}</ul> : <p className="muted">No source references attached to the current selection.</p>}
    </section>
  );
}
