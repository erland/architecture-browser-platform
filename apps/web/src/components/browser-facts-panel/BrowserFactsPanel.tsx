import type { BrowserClassPresentationMode, BrowserSessionState } from '../../browser-session';
import { buildBrowserFactsPanelPresentation } from './BrowserFactsPanel.presentation';
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
export { buildBrowserFactsPanelPresentation } from './BrowserFactsPanel.presentation';

export type BrowserFactsPanelProps = {
  state: BrowserSessionState;
  onSelectScope: (scopeId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
  onFocusRelationship: (relationshipId: string) => void;
  onAddEntities: (entityIds: string[]) => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onSetClassPresentationMode: (entityIds: string[], mode: BrowserClassPresentationMode) => void;
  onToggleClassPresentationMembers: (entityIds: string[], memberKind: 'fields' | 'functions') => void;
  onIsolateSelection: () => void;
  onRemoveSelection: () => void;
  onOpenSource: () => void;
  onClose: () => void;
};

export function BrowserFactsPanel(props: BrowserFactsPanelProps) {
  const { state, onSelectScope, onFocusEntity, onFocusRelationship, onAddEntities, onTogglePinNode, onSetClassPresentationMode, onToggleClassPresentationMembers, onIsolateSelection, onRemoveSelection, onOpenSource, onClose } = props;
  const presentation = buildBrowserFactsPanelPresentation(state);

  if (!presentation) {
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
      <FactsPanelHeader header={presentation.header} onClose={onClose} />
      <FactsPanelActions
        actions={presentation.header.actions}
        onAddEntities={onAddEntities}
        onTogglePinNode={onTogglePinNode}
        onSetClassPresentationMode={onSetClassPresentationMode}
        onToggleClassPresentationMembers={onToggleClassPresentationMembers}
        onIsolateSelection={onIsolateSelection}
        onRemoveSelection={onRemoveSelection}
        onOpenSource={onOpenSource}
      />
      <ViewpointSection section={presentation.viewpoint} onFocusEntity={onFocusEntity} />
      <ScopeSections section={presentation.scope} onSelectScope={onSelectScope} onFocusEntity={onFocusEntity} onAddEntities={onAddEntities} />
      <EntitySections section={presentation.entity} onSelectScope={onSelectScope} onFocusRelationship={onFocusRelationship} onAddEntities={onAddEntities} />
      <RelationshipSections section={presentation.relationship} onFocusEntity={onFocusEntity} />
      <DiagnosticsSection section={presentation.diagnostics} />
      <SourceRefsSection section={presentation.sourceRefs} />
    </section>
  );
}
