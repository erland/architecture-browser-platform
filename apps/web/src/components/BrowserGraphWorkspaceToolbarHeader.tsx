import type { BrowserGraphWorkspaceModel } from '../browserGraphWorkspaceModel';

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
  return (
    <header className="browser-canvas__header browser-canvas__header--compact">
      <div>
        <p className="eyebrow">Canvas</p>
        <h3>Local graph surface</h3>
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
