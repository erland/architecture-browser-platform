import type { BrowserFactsPanelDiagnosticsSectionModel, BrowserFactsPanelSourceRefsSectionModel } from './BrowserFactsPanel.types';
import { renderDiagnostic, renderSourceRef } from './BrowserFactsPanel.utils';

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
