import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import type { BrowserFactsPanelRelationshipSectionModel } from './BrowserFactsPanel.types';

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
