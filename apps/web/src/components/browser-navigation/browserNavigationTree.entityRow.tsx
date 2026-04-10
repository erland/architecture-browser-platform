import type { BrowserNavigationEntityNode } from './browserNavigationTree.shared';
import { getNavigationNodeKindLabel } from './browserNavigationTree.kindLabels';

const TREE_DRAG_MIME_TYPE = 'application/x-architecture-browser-entities';

export function BrowserNavigationEntityRow({
  node,
  hasChildren,
  isExpanded,
  onToggle,
  isSelected,
  onSelectEntity,
  onAddEntityToCanvas,
  selectedEntityIds,
}: {
  node: BrowserNavigationEntityNode;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: (entityId: string) => void;
  isSelected: boolean;
  onSelectEntity: (entityId: string, scopeId: string, additive?: boolean) => void;
  onAddEntityToCanvas: (entityId: string, scopeId: string) => void;
  selectedEntityIds: string[];
}) {
  return (
    <div className={isSelected ? 'browser-tree__row browser-tree__row--entity browser-tree__row--active' : 'browser-tree__row browser-tree__row--entity'} data-node-type="entity">
      <button
        type="button"
        className={hasChildren ? 'browser-tree__toggle browser-tree__toggle--entity' : 'browser-tree__toggle browser-tree__toggle--entity browser-tree__toggle--empty'}
        onClick={() => hasChildren && onToggle(node.entityId)}
        aria-label={hasChildren ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.displayName}` : `${node.displayName} has no child nodes`}
        aria-expanded={hasChildren ? isExpanded : undefined}
        disabled={!hasChildren}
      >
        {hasChildren ? (isExpanded ? '▾' : '▸') : '•'}
      </button>
      <button
        type="button"
        className="browser-tree__node-button browser-tree__node-button--entity"
        onClick={(event) => onSelectEntity(node.entityId, node.scopeId, event.metaKey || event.ctrlKey)}
        onDoubleClick={() => onAddEntityToCanvas(node.entityId, node.scopeId)}
        draggable
        onDragStart={(event) => {
          const dragEntityIds = isSelected && selectedEntityIds.length > 1 ? selectedEntityIds : [node.entityId];
          event.dataTransfer.effectAllowed = 'copy';
          event.dataTransfer.setData(TREE_DRAG_MIME_TYPE, JSON.stringify({ entityIds: dragEntityIds }));
          event.dataTransfer.setData('text/plain', dragEntityIds.join(','));
        }}
        title={`${node.displayName} — select entity`}
      >
        <span className="browser-tree__node-heading">
          <span className="browser-tree__node-title">{node.displayName}</span>
          {node.isViewpointPreferred && node.viewpointBadgeLabel ? (
            <span className="badge browser-tree__node-badge browser-tree__node-badge--viewpoint">{node.viewpointBadgeLabel}</span>
          ) : null}
          <span className="badge browser-tree__node-kind browser-tree__node-kind--entity" aria-hidden="true">{getNavigationNodeKindLabel(node)}</span>
        </span>
      </button>
      <button
        type="button"
        className="browser-tree__canvas-button"
        onClick={() => onAddEntityToCanvas(node.entityId, node.scopeId)}
        aria-label={`Add ${node.displayName} to canvas`}
        title={`Add ${node.displayName} to canvas`}
      >
        +
      </button>
    </div>
  );
}
