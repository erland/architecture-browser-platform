import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import type { BrowserFactsPanelEntitySectionModel } from './BrowserFactsPanel.types';

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
