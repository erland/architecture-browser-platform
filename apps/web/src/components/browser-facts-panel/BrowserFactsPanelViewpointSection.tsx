import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import type { BrowserFactsPanelViewpointSectionModel } from './BrowserFactsPanel.types';
import { renderViewpointList } from './BrowserFactsPanel.utils';

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
