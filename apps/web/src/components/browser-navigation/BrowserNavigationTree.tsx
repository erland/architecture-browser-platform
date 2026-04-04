import { detectDefaultBrowserTreeMode, type BrowserSearchResult, type BrowserSnapshotIndex, type BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState } from '../../browser-session';
import {
  buildNavigationEntityChildNodes,
  buildNavigationChildNodes,
  TREE_MODE_META,
  type BrowserNavigationChildNode,
  type BrowserNavigationEntityNode,
  type BrowserNavigationScopeNode,
} from './browserNavigationTree.model';
import { useBrowserNavigationTreeState } from './browserNavigationTree.state';

type BrowserNavigationTreeProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  treeMode: BrowserTreeMode;
  onSelectScope: (scopeId: string) => void;
  selectedEntityIds: string[];
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  onSelectEntity: (entityId: string, scopeId: string, additive?: boolean) => void;
  onAddEntityToCanvas: (entityId: string, scopeId: string) => void;
  onTreeModeChange: (treeMode: BrowserTreeMode) => void;
  persistedTreeState?: BrowserNavigationTreeViewState | null;
  onTreeStateChange?: (state: BrowserNavigationTreeViewState) => void;
  searchQuery?: string;
  searchResults?: BrowserSearchResult[];
  selectedViewpointId?: string | null;
};

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


function toRootNavigationScopeNode(node: {
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
}): BrowserNavigationScopeNode {
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
        {expanded ? `Show less` : `Show ${hiddenCount} more`}
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

function TreeNode({
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
}: {
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
  selectedEntityIds: string[];
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  onSelectEntity: (entityId: string, scopeId: string, additive?: boolean) => void;
  onAddEntityToCanvas: (entityId: string, scopeId: string) => void;
  visibleScopeIds: Set<string> | null;
  visibleEntityIds: Set<string> | null;
  expandedChildListIds: Set<string>;
  isSearchActive: boolean;
  selectedViewpointId: string | null;
}) {
  if (node.nodeType === 'entity') {
    const allChildren = node.expandable ? buildNavigationEntityChildNodes(index, node.entityId, node.scopeId, node.depth, node.path, visibleEntityIds, selectedViewpointId) : [];
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
              <TreeNode
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

  const allChildren = buildNavigationChildNodes(index, node.scopeId, treeMode, { visibleScopeIds, visibleEntityIds, viewpointId: selectedViewpointId });
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
            <TreeNode
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

export function BrowserNavigationTree({ index, selectedScopeId, selectedEntityIds, treeMode, onSelectScope, onAddScopeEntitiesToCanvas, onSelectEntity, onAddEntityToCanvas, onTreeModeChange, persistedTreeState = null, onTreeStateChange, searchQuery = '', searchResults = [], selectedViewpointId = null }: BrowserNavigationTreeProps) {
  const defaultBrowsableTreeMode: BrowserTreeMode = !index ? 'filesystem' : (() => {
    const detected = detectDefaultBrowserTreeMode(index);
    return detected === 'package' ? 'package' : 'filesystem';
  })();
  const effectiveTreeMode: BrowserTreeMode = treeMode === 'advanced' ? defaultBrowsableTreeMode : treeMode;

  const {
    roots,
    defaultTreeMode,
    expandedSet,
    expandedEntitySet,
    expandedChildListSet,
    toggleScope,
    toggleEntity,
    toggleChildList,
    expandAll,
    collapseToSelection,
    collapseAll,
    searchVisibility,
  } = useBrowserNavigationTreeState(index, selectedScopeId, selectedEntityIds, effectiveTreeMode, persistedTreeState, onTreeStateChange, searchQuery, searchResults);

  const visibleScopeIds = searchVisibility?.scopeIds ?? null;
  const visibleEntityIds = searchVisibility?.entityIds ?? null;
  const isSearchActive = searchQuery.trim().length > 0;

  if (!index) {
    return (
      <section className="card browser-navigation-tree browser-navigation-tree--empty">
        <p className="eyebrow">Navigation tree</p>
        <h2 className="app-nav__title">Scope explorer</h2>
        <p className="muted app-nav__lead">Prepare a snapshot locally to browse its scope tree in the Browser left rail.</p>
      </section>
    );
  }

  return (
    <section className="card browser-navigation-tree" aria-label="Scope navigation tree">
      <div className="browser-navigation-tree__header">
        <div>
          <p className="eyebrow">Navigation tree</p>
          <h2 className="app-nav__title">Scope explorer</h2>
        </div>
        <div className="browser-navigation-tree__actions">
          <button type="button" className="button-secondary" onClick={expandAll}>Expand</button>
          <button type="button" className="button-secondary" onClick={collapseAll}>Collapse</button>
          <button type="button" className="button-secondary" onClick={collapseToSelection}>Focus</button>
        </div>
      </div>

      {selectedEntityIds.length > 0 ? (
        <div className="browser-navigation-tree__search-meta">
          <span className="badge">{selectedEntityIds.length} selected</span>
          <span className="muted">Drag selected entities into the canvas or use the row + button to add them.</span>
        </div>
      ) : null}

      {searchQuery.trim() ? (
        <div className="browser-navigation-tree__search-meta">
          <span className="badge">Filtered by local search</span>
          <span className="muted">{searchResults.length} matching results</span>
        </div>
      ) : null}

      {selectedViewpointId ? (
        <div className="browser-navigation-tree__search-meta">
          <span className="badge">Biased by viewpoint</span>
          <span className="muted">Relevant entity kinds are prioritized, but all entity kinds remain visible.</span>
        </div>
      ) : null}

      <div className="browser-navigation-tree__modes" role="group" aria-label="Tree mode">
        {(['filesystem', 'package'] as BrowserTreeMode[])
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

      <ul className="browser-tree" role="tree">
        {roots.map((root) => (
          <TreeNode
            key={root.scopeId}
            index={index}
            node={toRootNavigationScopeNode(root)}
            treeMode={effectiveTreeMode}
            selectedScopeId={selectedScopeId}
            expandedScopeIds={expandedSet}
            expandedEntityIds={expandedEntitySet}
            onToggle={toggleScope}
            onToggleEntity={toggleEntity}
            onToggleChildList={toggleChildList}
            onSelectScope={onSelectScope}
            onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
            selectedEntityIds={selectedEntityIds}
            onSelectEntity={onSelectEntity}
            onAddEntityToCanvas={onAddEntityToCanvas}
            visibleScopeIds={visibleScopeIds}
            visibleEntityIds={visibleEntityIds}
            expandedChildListIds={expandedChildListSet}
            isSearchActive={isSearchActive}
            selectedViewpointId={selectedViewpointId}
          />
        ))}
      </ul>

      <footer className="browser-navigation-tree__footer">
        <p className="muted browser-navigation-tree__footer-note">
          {TREE_MODE_META[effectiveTreeMode].description}. Default: <strong>{TREE_MODE_META[defaultTreeMode === 'package' ? 'package' : 'filesystem'].label}</strong>.
        </p>
      </footer>
    </section>
  );
}

export {
  buildNavigationChildNodes,
  buildNavigationEntityChildNodes,
  buildScopeCategoryGroups,
  collectAncestorScopeIds,
  computeCollapsedAutoExpandState,
  computeCollapsedScopeIds,
  computeDefaultExpandedCategories,
  computeDefaultExpandedScopeIds,
  computeFocusExpandedState,
  computeSingleChildAutoExpandState,
} from './browserNavigationTree.model';
