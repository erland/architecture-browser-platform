import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import { buildNavigationEntityChildNodes, buildNavigationChildNodes } from './browserNavigationTree.nodes';
import { TREE_MODE_META, type BrowserNavigationChildNode, type BrowserNavigationScopeNode } from './browserNavigationTree.shared';
import { BROWSABLE_TREE_MODES } from './browserNavigationTree.rootPresentation';
import { BrowserNavigationChildList } from './browserNavigationTree.childList';
import { BrowserNavigationScopeRow } from './browserNavigationTree.scopeRow';
import { BrowserNavigationEntityRow } from './browserNavigationTree.entityRow';

const DEFAULT_VISIBLE_CHILDREN_LIMIT = 25;

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

function capVisibleChildren<T>({
  allChildren,
  nodeId,
  expandedChildListIds,
  isSearchActive,
}: {
  allChildren: T[];
  nodeId: string;
  expandedChildListIds: Set<string>;
  isSearchActive: boolean;
}) {
  const isChildListExpanded = expandedChildListIds.has(nodeId);
  const shouldCapChildren = !isSearchActive && allChildren.length > DEFAULT_VISIBLE_CHILDREN_LIMIT;
  const visibleChildren = shouldCapChildren && !isChildListExpanded ? allChildren.slice(0, DEFAULT_VISIBLE_CHILDREN_LIMIT) : allChildren;
  return {
    isChildListExpanded,
    visibleChildren,
    hiddenChildrenCount: allChildren.length - visibleChildren.length,
  };
}

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
    const { isChildListExpanded, visibleChildren, hiddenChildrenCount } = capVisibleChildren({
      allChildren,
      nodeId: node.nodeId,
      expandedChildListIds,
      isSearchActive,
    });

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
        <BrowserNavigationChildList
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          hiddenChildrenCount={hiddenChildrenCount}
          isChildListExpanded={isChildListExpanded}
          nodeId={node.nodeId}
          onToggleChildList={onToggleChildList}
        >
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
        </BrowserNavigationChildList>
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
  const { isChildListExpanded, visibleChildren, hiddenChildrenCount } = capVisibleChildren({
    allChildren,
    nodeId: node.nodeId,
    expandedChildListIds,
    isSearchActive,
  });

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

      <BrowserNavigationChildList
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        hiddenChildrenCount={hiddenChildrenCount}
        isChildListExpanded={isChildListExpanded}
        nodeId={node.nodeId}
        onToggleChildList={onToggleChildList}
      >
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
      </BrowserNavigationChildList>
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
