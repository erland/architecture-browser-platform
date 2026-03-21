import type { BrowserSessionState } from '../browserSessionStore';
import { buildBrowserFactsPanelModel } from './BrowserFactsPanel.model';
import {
  DiagnosticsSection,
  EntitySections,
  FactsPanelActions,
  FactsPanelHeader,
  RelationshipSections,
  ScopeSections,
  SourceRefsSection,
  ViewpointSection,
} from './BrowserFactsPanel.sections';

export type {
  BrowserFactsPanelEntityGroup,
  BrowserFactsPanelEntitySummary,
  BrowserFactsPanelModel,
  BrowserFactsPanelRelationshipMetadata,
  BrowserFactsPanelRelationshipMetadataEntry,
  BrowserFactsPanelScopeBridge,
  BrowserFactsPanelScopeSummary,
  BrowserFactsPanelViewpointExplanation,
} from './BrowserFactsPanel.types';

export { buildBrowserFactsPanelModel } from './BrowserFactsPanel.model';

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

export function BrowserFactsPanel(props: BrowserFactsPanelProps) {
  const { state, onSelectScope, onFocusEntity, onFocusRelationship, onAddEntities, onTogglePinNode, onIsolateSelection, onRemoveSelection, onClose } = props;
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
      <FactsPanelHeader model={model} onClose={onClose} />
      <FactsPanelActions
        model={model}
        state={state}
        onTogglePinNode={onTogglePinNode}
        onIsolateSelection={onIsolateSelection}
        onRemoveSelection={onRemoveSelection}
      />
      <ViewpointSection model={model} onFocusEntity={onFocusEntity} />
      <ScopeSections model={model} onSelectScope={onSelectScope} onFocusEntity={onFocusEntity} onAddEntities={onAddEntities} />
      <EntitySections model={model} onSelectScope={onSelectScope} onFocusRelationship={onFocusRelationship} />
      <RelationshipSections model={model} state={state} onFocusEntity={onFocusEntity} />
      <DiagnosticsSection model={model} />
      <SourceRefsSection model={model} />
    </section>
  );
}
