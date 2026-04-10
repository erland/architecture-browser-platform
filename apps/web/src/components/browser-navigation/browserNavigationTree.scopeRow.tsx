import type { BrowserNavigationScopeNode } from './browserNavigationTree.shared';
import { getNavigationNodeKindLabel } from './browserNavigationTree.kindLabels';

export function BrowserNavigationScopeRow({
  node,
  hasChildren,
  isExpanded,
  isSelected,
  onToggle,
  onSelectScope,
  onAddScopeEntitiesToCanvas,
}: {
  node: BrowserNavigationScopeNode;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (scopeId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
}) {
  return (
    <div className={isSelected ? 'browser-tree__row browser-tree__row--active' : 'browser-tree__row'} data-node-type="scope">
      <button
        type="button"
        className={hasChildren ? 'browser-tree__toggle' : 'browser-tree__toggle browser-tree__toggle--empty'}
        onClick={() => hasChildren && onToggle(node.scopeId)}
        aria-label={hasChildren ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.displayName}` : `${node.displayName} has no child nodes`}
        aria-expanded={hasChildren ? isExpanded : undefined}
        disabled={!hasChildren}
      >
        {hasChildren ? (isExpanded ? '▾' : '▸') : '•'}
      </button>

      <button
        type="button"
        className="browser-tree__node-button"
        onClick={() => onSelectScope(node.scopeId)}
        onDoubleClick={() => onAddScopeEntitiesToCanvas(node.scopeId)}
        title={`${node.displayName} — double-click to add primary entities to canvas`}
      >
        <span className="browser-tree__node-heading">
          <span className="browser-tree__node-title">{node.displayName}</span>
          <span className="badge browser-tree__node-kind" aria-hidden="true">{getNavigationNodeKindLabel(node)}</span>
        </span>
      </button>

      <button
        type="button"
        className="browser-tree__canvas-button"
        onClick={() => onAddScopeEntitiesToCanvas(node.scopeId)}
        aria-label={`Add primary entities for ${node.displayName} to canvas`}
        title={`Add primary entities for ${node.displayName} to canvas`}
      >
        +
      </button>
    </div>
  );
}
