import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';

function hasContainmentEdges(model: BrowserGraphWorkspaceModel) {
  return model.edges.some((edge) => edge.semanticStyle === 'containment');
}

function hasEndpointMultiplicityLabels(model: BrowserGraphWorkspaceModel) {
  return model.edges.some((edge) => Boolean(edge.fromLabel || edge.toLabel));
}

export function BrowserGraphWorkspaceToolbarHeader({
  model,
  activeModeLabel,
  selectedEntityCount,
  pinnedNodeCount,
}: {
  model: BrowserGraphWorkspaceModel;
  activeModeLabel: string;
  selectedEntityCount: number;
  pinnedNodeCount: number;
}) {
  const showContainmentLegend = hasContainmentEdges(model);
  const showMultiplicityLegend = hasEndpointMultiplicityLabels(model);

  return (
    <header className="browser-canvas__header browser-canvas__header--compact">
      <div>
        <p className="eyebrow">Canvas</p>
        <h3>Local graph surface</h3>
        {showContainmentLegend || showMultiplicityLegend ? (
          <p className="browser-canvas__legend muted">
            {showMultiplicityLegend ? <span title="Endpoint labels show multiplicity at each end of the relationship.">Endpoint labels = multiplicity</span> : null}
            {showMultiplicityLegend && showContainmentLegend ? <span aria-hidden="true"> · </span> : null}
            {showContainmentLegend ? <span title="Containment marks ownership or lifecycle-style parent-child relationships.">containment = owning/lifecycle relationship</span> : null}
          </p>
        ) : null}
      </div>
      <div className="browser-canvas__header-meta">
        <span className="badge">{model.nodes.length} nodes</span>
        <span className="badge">{model.edges.length} edges</span>
        <span className="badge">{selectedEntityCount} selected</span>
        <span className="badge">{pinnedNodeCount} pinned</span>
        <span className="badge">{activeModeLabel}</span>
      </div>
    </header>
  );
}
