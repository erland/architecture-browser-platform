import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import type { BrowserFactsPanelScopeSectionModel } from './BrowserFactsPanel.types';
import { renderEntityButtonLabel } from './BrowserFactsPanel.utils';

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
