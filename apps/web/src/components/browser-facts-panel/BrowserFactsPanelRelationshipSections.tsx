import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import type { BrowserFactsPanelRelationshipSectionModel } from './BrowserFactsPanel.types';

export function RelationshipSections({ section, onFocusEntity, onFocusRelationship }: Pick<BrowserFactsPanelProps, 'onFocusEntity' | 'onFocusRelationship'> & { section: BrowserFactsPanelRelationshipSectionModel | null }) {
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
          <p className="muted">Normalized association details are the primary browser-facing summary. Framework-specific entries below show the retained field-level JPA hints.</p>
          <div className="browser-facts-panel__split">
            <div>
              <h5>Normalized association</h5>
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
              <h5>Framework-level evidence</h5>
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

      <section className="browser-facts-panel__section">
        <div className="browser-facts-panel__section-header">
          <h4>Raw evidence</h4>
        </div>
        <p className="muted">These are the underlying raw relationships retained as evidence for the canonical association shown on the canvas.</p>
        {section.evidenceRelationships.length > 0 ? (
          <ul className="browser-facts-panel__list">
            {section.evidenceRelationships.map((relationship) => (
              <li key={relationship.relationshipId} className="browser-facts-panel__list-item browser-facts-panel__list-item--actionable">
                {relationship.existsInSnapshot ? (
                  <button type="button" className="button-secondary" onClick={() => onFocusRelationship(relationship.relationshipId)}>{relationship.label}</button>
                ) : (
                  <strong>{relationship.label}</strong>
                )}
                <span>{relationship.summary}</span>
                <span className="muted">{relationship.sourceRefCount} source refs</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No retained raw relationship evidence.</p>}
      </section>
    </>
  );
}
