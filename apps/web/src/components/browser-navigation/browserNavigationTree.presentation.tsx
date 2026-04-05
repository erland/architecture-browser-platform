import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import { buildNavigationEntityChildNodes, buildNavigationChildNodes } from './browserNavigationTree.nodes';
import { TREE_MODE_META, type BrowserNavigationChildNode, type BrowserNavigationEntityNode, type BrowserNavigationScopeNode } from './browserNavigationTree.shared';
import { BROWSABLE_TREE_MODES } from './browserNavigationTree.rootPresentation';

const DEFAULT_VISIBLE_CHILDREN_LIMIT = 25;
const TREE_DRAG_MIME_TYPE = 'application/x-architecture-browser-entities';

function getNodeKindLabel(node: BrowserNavigationChildNode) {
  if (node.nodeType === 'scope') {
    switch (node.kind) {
      case 'REPOSITORY':
        return 'Repo';
      case 'DIRECTORY':
        return 'Dir';
      case 'FILE':
        return 'File';
      case 'PACKAGE':
        return 'Pkg';
      case 'MODULE':
        return 'Mod';
      default:
        return 'Scope';
    }
  }
  switch (node.kind) {
    case 'CLASS':
      return 'Cls';
    case 'INTERFACE':
      return 'Ifc';
    case 'ENUM':
      return 'Enum';
    case 'SERVICE':
      return 'Svc';
    case 'REPOSITORY':
      return 'Repo';
    case 'ENDPOINT':
      return 'API';
    case 'COMPONENT':
      return 'UI';
    case 'HOOK':
      return 'Hook';
    case 'FUNCTION':
      return 'Fn';
    case 'MODULE':
      return 'Mod';
    default:
      return 'Ent';
  }
}

type RootScopeInput = {
  scopeId: string;
  parentScopeId: string | null;
  kind: string;
  name: string;
  displayName: string;
  path: string;
  depth: number;
  childScopeIds: string[];
  directEntityIds: string[];
  descendantScopeCount: number;
  descendantEntityCount: number;
};

export function toRootNavigationScopeNode(node: RootScopeInput): BrowserNavigationScopeNode {
  return {
    nodeType: 'scope',
    nodeId: `scope-node:${node.scopeId}`,
    scopeId: node.scopeId,
    parentScopeId: node.parentScopeId,
    kind: node.kind,
    name: node.name,
    displayName: node.displayName,
    path: node.path,
    depth: node.depth,
    childScopeIds: node.childScopeIds,
    directEntityIds: node.directEntityIds,
    descendantScopeCount: node.descendantScopeCount,
    descendantEntityCount: node.descendantEntityCount,
    badgeLabel: node.kind.replace(/_/g, ' ').toLocaleLowerCase().replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase()),
    icon: 'scope',
  };
}

function BrowserNavigationOverflowControls({
  nodeId,
  hiddenCount,
  expanded,
  onToggle,
}: {
  nodeId: string;
  hiddenCount: number;
  expanded: boolean;
  onToggle: (nodeId: string) => void;
}) {
  if (hiddenCount <= 0) {
    return null;
  }
  return (
    <li className="browser-tree__item browser-tree__item--overflow">
      <button
        type="button"
        className="browser-tree__show-more"
        onClick={() => onToggle(nodeId)}
        aria-expanded={expanded}
      >
        {expanded ? 'Show less' : `Show ${hiddenCount} more`}
      </button>
    </li>
  );
}

function BrowserNavigationScopeRow({
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
          <span className="badge browser-tree__node-kind" aria-hidden="true">{getNodeKindLabel(node)}</span>
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

function BrowserNavigationEntityRow({
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
          <span className="badge browser-tree__node-kind browser-tree__node-kind--entity" aria-hidden="true">{getNodeKindLabel(node)}</span>
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

type TreeNodeProps = {
  index: BrowserSnapshotIndex;
  node: BrowserNavigationChildNode;
  treeMode: BrowserTreeMode;
  selectedScopeId: string | null;
  expandedScopeIds: Set<string>;
  expandedEntityIds: Set<string>;
  onToggle: (scopeId: string) => void;
  onToggleEntity: (entityId: string) => void;
  onToggleChildList: (nodeId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  selectedEntityIds: string[];
  onSelectEntity: (entityId: string, scopeId: string, additive?: boolean) => void;
  onAddEntityToCanvas: (entityId: string, scopeId: string) => void;
  visibleScopeIds: Set<string> | null;
  visibleEntityIds: Set<string> | null;
  expandedChildListIds: Set<string>;
  isSearchActive: boolean;
  selectedViewpointId: string | null;
};

export function BrowserNavigationTreeNode({
  index,
  node,
  treeMode,
  selectedScopeId,
  expandedScopeIds,
  expandedEntityIds,
  onToggle,
  onToggleEntity,
  onToggleChildList,
  onSelectScope,
  onAddScopeEntitiesToCanvas,
  selectedEntityIds,
  onSelectEntity,
  onAddEntityToCanvas,
  visibleScopeIds,
  visibleEntityIds,
  expandedChildListIds,
  isSearchActive,
  selectedViewpointId,
}: TreeNodeProps) {
  if (node.nodeType === 'entity') {
    const allChildren = node.expandable
      ? buildNavigationEntityChildNodes(index, node.entityId, node.scopeId, node.depth, node.path, visibleEntityIds, selectedViewpointId)
      : [];
    const hasChildren = allChildren.length > 0;
    const isExpanded = expandedEntityIds.has(node.entityId);
    const isChildListExpanded = expandedChildListIds.has(node.nodeId);
    const shouldCapChildren = !isSearchActive && allChildren.length > DEFAULT_VISIBLE_CHILDREN_LIMIT;
    const visibleChildren = shouldCapChildren && !isChildListExpanded ? allChildren.slice(0, DEFAULT_VISIBLE_CHILDREN_LIMIT) : allChildren;
    const hiddenChildrenCount = allChildren.length - visibleChildren.length;

    return (
      <li className="browser-tree__item" data-node-type="entity">
        <BrowserNavigationEntityRow
          node={node}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={onToggleEntity}
          isSelected={selectedEntityIds.includes(node.entityId)}
          onSelectEntity={onSelectEntity}
          onAddEntityToCanvas={onAddEntityToCanvas}
          selectedEntityIds={selectedEntityIds}
        />
        {hasChildren && isExpanded ? (
          <ul className="browser-tree__children" role="group">
            {visibleChildren.map((child) => (
              <BrowserNavigationTreeNode
                key={child.nodeId}
                index={index}
                node={child}
                treeMode={treeMode}
                selectedScopeId={selectedScopeId}
                expandedScopeIds={expandedScopeIds}
                expandedEntityIds={expandedEntityIds}
                onToggle={onToggle}
                onToggleEntity={onToggleEntity}
                onToggleChildList={onToggleChildList}
                onSelectScope={onSelectScope}
                onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
                selectedEntityIds={selectedEntityIds}
                onSelectEntity={onSelectEntity}
                onAddEntityToCanvas={onAddEntityToCanvas}
                visibleScopeIds={visibleScopeIds}
                visibleEntityIds={visibleEntityIds}
                expandedChildListIds={expandedChildListIds}
                isSearchActive={isSearchActive}
                selectedViewpointId={selectedViewpointId}
              />
            ))}
            <BrowserNavigationOverflowControls
              nodeId={node.nodeId}
              hiddenCount={hiddenChildrenCount}
              expanded={isChildListExpanded}
              onToggle={onToggleChildList}
            />
          </ul>
        ) : null}
      </li>
    );
  }

  const allChildren = buildNavigationChildNodes(index, node.scopeId, treeMode, {
    visibleScopeIds,
    visibleEntityIds,
    viewpointId: selectedViewpointId,
  });
  const isExpanded = expandedScopeIds.has(node.scopeId);
  const isSelected = selectedScopeId === node.scopeId;
  const hasChildren = allChildren.length > 0;
  const isChildListExpanded = expandedChildListIds.has(node.nodeId);
  const shouldCapChildren = !isSearchActive && allChildren.length > DEFAULT_VISIBLE_CHILDREN_LIMIT;
  const visibleChildren = shouldCapChildren && !isChildListExpanded ? allChildren.slice(0, DEFAULT_VISIBLE_CHILDREN_LIMIT) : allChildren;
  const hiddenChildrenCount = allChildren.length - visibleChildren.length;

  return (
    <li className="browser-tree__item" data-node-type="scope">
      <BrowserNavigationScopeRow
        node={node}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onToggle={onToggle}
        onSelectScope={onSelectScope}
        onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
      />

      {hasChildren && isExpanded ? (
        <ul className="browser-tree__children" role="group">
          {visibleChildren.map((child) => (
            <BrowserNavigationTreeNode
              key={child.nodeId}
              index={index}
              node={child}
              treeMode={treeMode}
              selectedScopeId={selectedScopeId}
              expandedScopeIds={expandedScopeIds}
              expandedEntityIds={expandedEntityIds}
              onToggle={onToggle}
              onToggleEntity={onToggleEntity}
              onToggleChildList={onToggleChildList}
              onSelectScope={onSelectScope}
              onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
              selectedEntityIds={selectedEntityIds}
              onSelectEntity={onSelectEntity}
              onAddEntityToCanvas={onAddEntityToCanvas}
              visibleScopeIds={visibleScopeIds}
              visibleEntityIds={visibleEntityIds}
              expandedChildListIds={expandedChildListIds}
              isSearchActive={isSearchActive}
              selectedViewpointId={selectedViewpointId}
            />
          ))}
          <BrowserNavigationOverflowControls
            nodeId={node.nodeId}
            hiddenCount={hiddenChildrenCount}
            expanded={isChildListExpanded}
            onToggle={onToggleChildList}
          />
        </ul>
      ) : null}
    </li>
  );
}

export function BrowserNavigationTreeModeButtons({
  effectiveTreeMode,
  onTreeModeChange,
}: {
  effectiveTreeMode: BrowserTreeMode;
  onTreeModeChange: (treeMode: BrowserTreeMode) => void;
}) {
  return (
    <div className="browser-navigation-tree__modes" role="group" aria-label="Tree mode">
      {BROWSABLE_TREE_MODES
        .map((mode) => [mode, TREE_MODE_META[mode]] as const)
        .map(([mode, meta]) => (
          <button
            key={mode}
            type="button"
            className={effectiveTreeMode === mode ? 'button-secondary browser-navigation-tree__mode-button browser-navigation-tree__mode-button--active' : 'button-secondary browser-navigation-tree__mode-button'}
            onClick={() => onTreeModeChange(mode)}
            title={meta.description}
            aria-pressed={effectiveTreeMode === mode}
          >
            {meta.label}
          </button>
        ))}
    </div>
  );
}
