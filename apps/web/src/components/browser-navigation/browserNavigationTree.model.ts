import {
  canExpandEntityInNavigationTree,
  collectVisibleAncestorScopeIds,
  detectDefaultBrowserTreeMode,
  getArchitecturalRoles,
  getApiSurfaceRolePriority,
  getExpandableNavigationChildrenForEntity,
  getEligibleDirectEntitiesForScope,
  getIntegrationMapRolePriority,
  getModuleDependenciesRolePriority,
  getPersistenceModelRolePriority,
  getRequestHandlingRolePriority,
  getScopeTreeNodesForMode,
  getUiNavigationRolePriority,
  isScopeVisibleInTreeMode,
  type BrowserSearchResult,
  type BrowserSnapshotIndex,
  type BrowserScopeTreeNode,
  type BrowserTreeMode,
} from '../../browser-snapshot';

export type BrowserScopeCategoryGroup = {
  kind: string;
  label: string;
  nodes: BrowserScopeTreeNode[];
};

export type BrowserNavigationScopeNode = {
  nodeType: 'scope';
  nodeId: string;
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
  badgeLabel: string;
  icon: 'scope';
};

export type BrowserNavigationEntityNode = {
  nodeType: 'entity';
  nodeId: string;
  entityId: string;
  scopeId: string;
  parentScopeId: string;
  parentEntityId: string | null;
  kind: string;
  name: string;
  displayName: string;
  path: string;
  depth: number;
  badgeLabel: string;
  icon: 'entity';
  expandable: boolean;
  viewpointPriority: number;
  isViewpointPreferred: boolean;
  viewpointBadgeLabel: string | null;
};

export type BrowserNavigationChildNode = BrowserNavigationScopeNode | BrowserNavigationEntityNode;


export type BrowserNavigationSearchVisibility = {
  scopeIds: Set<string>;
  entityIds: Set<string>;
};

const VIEWPOINT_BIAS_BADGE_LABEL: Record<string, string> = {
  'api-surface': 'API focus',
  'request-handling': 'Flow focus',
  'persistence-model': 'Persistence focus',
  'integration-map': 'Integration focus',
  'module-dependencies': 'Module focus',
  'ui-navigation': 'UI focus',
};

function getViewpointEntityBias(index: BrowserSnapshotIndex, entityId: string, viewpointId: string | null | undefined) {
  const entity = index.entitiesById.get(entityId);
  if (!entity || !viewpointId) {
    return { priority: 999, preferred: false, badgeLabel: null as string | null };
  }
  const roles = new Set(getArchitecturalRoles(entity));
  const priority = viewpointId === 'api-surface'
    ? getApiSurfaceRolePriority(entity)
    : viewpointId === 'request-handling'
      ? getRequestHandlingRolePriority(entity)
      : viewpointId === 'persistence-model'
        ? getPersistenceModelRolePriority(entity)
        : viewpointId === 'integration-map'
          ? getIntegrationMapRolePriority(entity)
          : viewpointId === 'module-dependencies'
            ? getModuleDependenciesRolePriority(entity)
            : viewpointId === 'ui-navigation'
              ? getUiNavigationRolePriority(entity)
              : 999;
  const preferred = viewpointId === 'api-surface'
    ? roles.has('api-entrypoint') || roles.has('application-service') || roles.has('integration-adapter') || roles.has('external-dependency')
    : viewpointId === 'request-handling'
      ? roles.has('api-entrypoint') || roles.has('application-service')
      : viewpointId === 'persistence-model'
        ? roles.has('persistence-access') || roles.has('persistent-entity') || roles.has('datastore')
        : viewpointId === 'integration-map'
          ? roles.has('integration-adapter') || roles.has('external-dependency')
          : viewpointId === 'module-dependencies'
            ? roles.has('module-boundary') || entity.kind === 'MODULE' || entity.kind === 'PACKAGE'
            : viewpointId === 'ui-navigation'
              ? roles.has('ui-layout') || roles.has('ui-page') || roles.has('ui-navigation-node')
              : false;
  return {
    priority,
    preferred,
    badgeLabel: preferred ? (VIEWPOINT_BIAS_BADGE_LABEL[viewpointId] ?? 'Viewpoint') : null,
  };
}

function toNavigationScopeNode(node: BrowserScopeTreeNode): BrowserNavigationScopeNode {
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
    badgeLabel: toCategoryLabel(node.kind),
    icon: 'scope',
  };
}

function toNavigationEntityNode(
  index: BrowserSnapshotIndex,
  scopeId: string,
  entityId: string,
  options?: {
    parentEntityId?: string | null;
    parentPath?: string;
    depth?: number;
    viewpointId?: string | null;
  },
): BrowserNavigationEntityNode | null {
  const entity = index.entitiesById.get(entityId);
  if (!entity || !entity.scopeId) {
    return null;
  }
  const scopePath = index.scopePathById.get(scopeId) ?? scopeId;
  const parentEntityId = options?.parentEntityId ?? null;
  const displayName = entity.displayName ?? entity.name;
  const path = options?.parentPath ? `${options.parentPath} / ${displayName}` : `${scopePath} / ${displayName}`;
  const viewpointBias = getViewpointEntityBias(index, entity.externalId, options?.viewpointId);
  return {
    nodeType: 'entity',
    nodeId: parentEntityId ? `entity-node:${parentEntityId}>${entity.externalId}` : `entity-node:${entity.externalId}`,
    entityId: entity.externalId,
    scopeId: entity.scopeId,
    parentScopeId: scopeId,
    parentEntityId,
    kind: entity.kind,
    name: entity.name,
    displayName,
    path,
    depth: options?.depth ?? ((index.scopesById.get(scopeId) ? (index.scopeNodesByParentId.get(index.scopesById.get(scopeId)?.parentScopeId ?? null)?.find((candidate) => candidate.scopeId === scopeId)?.depth ?? 0) : 0) + 1),
    badgeLabel: toCategoryLabel(entity.kind),
    icon: 'entity',
    expandable: canExpandEntityInNavigationTree(index, entity.externalId),
    viewpointPriority: viewpointBias.priority,
    isViewpointPreferred: viewpointBias.preferred,
    viewpointBadgeLabel: viewpointBias.badgeLabel,
  };
}

function sortNavigationEntityNodes(left: BrowserNavigationEntityNode, right: BrowserNavigationEntityNode) {
  if (left.viewpointPriority !== right.viewpointPriority) return left.viewpointPriority - right.viewpointPriority;
  if (left.isViewpointPreferred !== right.isViewpointPreferred) return left.isViewpointPreferred ? -1 : 1;
  if (left.kind !== right.kind) return left.kind.localeCompare(right.kind, undefined, { sensitivity: 'base' });
  return left.displayName.localeCompare(right.displayName, undefined, { sensitivity: 'base' });
}

export function buildNavigationEntityChildNodes(index: BrowserSnapshotIndex, parentEntityId: string, scopeId: string, parentDepth: number, parentPath: string, visibleEntityIds?: Set<string> | null, viewpointId?: string | null) {
  return getExpandableNavigationChildrenForEntity(index, parentEntityId)
    .filter((entity) => !visibleEntityIds || visibleEntityIds.has(entity.externalId))
    .map((entity) => toNavigationEntityNode(index, scopeId, entity.externalId, {
      parentEntityId,
      parentPath,
      depth: parentDepth + 1,
      viewpointId,
    }))
    .filter((node): node is BrowserNavigationEntityNode => Boolean(node))
    .sort(sortNavigationEntityNodes);
}


export type BrowserNavigationAutoExpandState = {
  scopeIds: string[];
  entityIds: string[];
};

function appendUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function collectSingleChildAutoExpandStateFromEntity(index: BrowserSnapshotIndex, entityId: string, state: BrowserNavigationAutoExpandState, seen: Set<string>) {
  const seenKey = `entity:${entityId}`;
  if (seen.has(seenKey)) {
    return;
  }
  seen.add(seenKey);
  const children = getExpandableNavigationChildrenForEntity(index, entityId);
  if (children.length !== 1) {
    return;
  }
  const [singleChild] = children;
  if (!canExpandEntityInNavigationTree(index, singleChild.externalId)) {
    return;
  }
  appendUnique(state.entityIds, singleChild.externalId);
  collectSingleChildAutoExpandStateFromEntity(index, singleChild.externalId, state, seen);
}

function collectSingleChildAutoExpandStateFromScope(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode, scopeId: string | null, state: BrowserNavigationAutoExpandState, seen: Set<string>) {
  const seenKey = `scope:${scopeId ?? 'root'}`;
  if (seen.has(seenKey)) {
    return;
  }
  seen.add(seenKey);
  const children = buildNavigationChildNodes(index, scopeId, treeMode);
  if (children.length !== 1) {
    return;
  }
  const [singleChild] = children;
  if (singleChild.nodeType === 'scope') {
    appendUnique(state.scopeIds, singleChild.scopeId);
    collectSingleChildAutoExpandStateFromScope(index, treeMode, singleChild.scopeId, state, seen);
    return;
  }
  if (!singleChild.expandable) {
    return;
  }
  appendUnique(state.entityIds, singleChild.entityId);
  collectSingleChildAutoExpandStateFromEntity(index, singleChild.entityId, state, seen);
}

export function computeSingleChildAutoExpandState(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode, parent: { scopeId?: string | null; entityId?: string | null } = {}): BrowserNavigationAutoExpandState {
  const state: BrowserNavigationAutoExpandState = { scopeIds: [], entityIds: [] };
  const seen = new Set<string>();
  if (parent.entityId) {
    collectSingleChildAutoExpandStateFromEntity(index, parent.entityId, state, seen);
    return state;
  }
  collectSingleChildAutoExpandStateFromScope(index, treeMode, parent.scopeId ?? null, state, seen);
  return state;
}

export function buildNavigationChildNodes(index: BrowserSnapshotIndex, parentScopeId: string | null, treeMode: BrowserTreeMode, options?: { visibleScopeIds?: Set<string> | null; visibleEntityIds?: Set<string> | null; viewpointId?: string | null }): BrowserNavigationChildNode[] {
  const scopeNodes = getScopeTreeNodesForMode(index, parentScopeId, treeMode)
    .filter((node) => !options?.visibleScopeIds || options.visibleScopeIds.has(node.scopeId))
    .map(toNavigationScopeNode);
  if (!parentScopeId) {
    return scopeNodes;
  }
  const entityNodes = getEligibleDirectEntitiesForScope(index, parentScopeId)
    .filter((entity) => !options?.visibleEntityIds || options.visibleEntityIds.has(entity.externalId))
    .map((entity) => toNavigationEntityNode(index, parentScopeId, entity.externalId, { viewpointId: options?.viewpointId }))
    .filter((node): node is BrowserNavigationEntityNode => Boolean(node))
    .sort(sortNavigationEntityNodes);
  return [...scopeNodes, ...entityNodes];
}

export const TREE_MODE_META: Record<BrowserTreeMode, { label: string; description: string }> = {
  filesystem: { label: 'Filesystem', description: 'Directory and file structure' },
  package: { label: 'Package', description: 'Package-focused structure' },
  advanced: { label: 'All scopes', description: 'Full scope/debug view' },
};

function toCategoryLabel(kind: string) {
  return kind.replace(/_/g, ' ').toLocaleLowerCase().replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase());
}

export function buildScopeCategoryGroups(nodes: BrowserScopeTreeNode[]) {
  const grouped = new Map<string, BrowserScopeTreeNode[]>();
  for (const node of nodes) {
    const current = grouped.get(node.kind);
    if (current) {
      current.push(node);
    } else {
      grouped.set(node.kind, [node]);
    }
  }
  return [...grouped.entries()]
    .map(([kind, groupNodes]) => ({
      kind,
      label: toCategoryLabel(kind),
      nodes: groupNodes,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }));
}

function findTopLevelVisibleScopeKind(index: BrowserSnapshotIndex, scopeId: string | null, treeMode: BrowserTreeMode) {
  if (!scopeId) {
    return null;
  }
  for (const root of getScopeTreeNodesForMode(index, null, treeMode)) {
    if (root.scopeId === scopeId) {
      return root.kind;
    }
    const descendants = getScopeTreeNodesForMode(index, root.scopeId, treeMode);
    if (descendants.some((node) => node.scopeId === scopeId)) {
      return root.kind;
    }
  }
  return null;
}

export function computeDefaultExpandedCategories(groups: BrowserScopeCategoryGroup[], index: BrowserSnapshotIndex | null, selectedScopeId: string | null, treeMode: BrowserTreeMode = 'advanced') {
  if (!groups.length) {
    return [] as string[];
  }
  const selectedKind = index ? findTopLevelVisibleScopeKind(index, selectedScopeId, treeMode) : null;
  if (!selectedKind) {
    return groups.map((group) => group.kind);
  }
  return groups.map((group) => group.kind).filter((kind) => kind === selectedKind);
}

export function collectAncestorScopeIds(index: BrowserSnapshotIndex, scopeId: string | null, treeMode: BrowserTreeMode = 'advanced') {
  if (!scopeId) {
    return [] as string[];
  }
  if (treeMode === 'advanced') {
    const ancestors: string[] = [];
    const seen = new Set<string>();
    let current = index.scopesById.get(scopeId);
    while (current?.parentScopeId && !seen.has(current.parentScopeId)) {
      seen.add(current.parentScopeId);
      ancestors.unshift(current.parentScopeId);
      current = index.scopesById.get(current.parentScopeId);
    }
    return ancestors;
  }
  return collectVisibleAncestorScopeIds(index, scopeId, treeMode);
}

export function computeDefaultExpandedScopeIds(index: BrowserSnapshotIndex | null, selectedScopeId: string | null, treeMode: BrowserTreeMode = 'advanced') {
  if (!index) {
    return [] as string[];
  }
  const rootIds = getScopeTreeNodesForMode(index, null, treeMode).map((node) => node.scopeId);
  const selectedIds = selectedScopeId && isScopeVisibleInTreeMode(index, selectedScopeId, treeMode) ? [selectedScopeId] : [];
  return [...new Set([...rootIds, ...collectAncestorScopeIds(index, selectedScopeId, treeMode), ...selectedIds])];
}

export function collectSafeNavigationAncestorEntityIds(index: BrowserSnapshotIndex, entityId: string) {
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let currentId = entityId;
  while (!seen.has(currentId)) {
    seen.add(currentId);
    const containers = index.containerEntityIdsByEntityId.get(currentId) ?? [];
    const nextContainerId = containers.find((containerId) => canExpandEntityInNavigationTree(index, containerId));
    if (!nextContainerId) {
      break;
    }
    ancestors.unshift(nextContainerId);
    currentId = nextContainerId;
  }
  return ancestors;
}

export function collectAllExpandableEntityIds(index: BrowserSnapshotIndex) {
  return [...index.entitiesById.keys()].filter((entityId) => canExpandEntityInNavigationTree(index, entityId));
}

export function collectAllVisibleScopeIds(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode, parentScopeId: string | null = null): string[] {
  const nodes = getScopeTreeNodesForMode(index, parentScopeId, treeMode);
  return nodes.flatMap((node) => [node.scopeId, ...collectAllVisibleScopeIds(index, treeMode, node.scopeId)]);
}

export function buildNavigationTreeSummary(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode) {
  const roots = getScopeTreeNodesForMode(index, null, treeMode);
  return {
    roots,
    totalDescendants: roots.reduce((sum, node) => sum + node.descendantScopeCount, 0),
    totalDirectEntities: roots.reduce((sum, node) => sum + node.directEntityIds.length, 0),
    defaultTreeMode: detectDefaultBrowserTreeMode(index),
  };
}


export function computeFocusExpandedState(index: BrowserSnapshotIndex | null, selectedScopeId: string | null, selectedEntityIds: string[], treeMode: BrowserTreeMode = 'advanced'): BrowserNavigationAutoExpandState {
  if (!index) {
    return { scopeIds: [], entityIds: [] };
  }

  const scopeIds = selectedScopeId && isScopeVisibleInTreeMode(index, selectedScopeId, treeMode)
    ? [...new Set([...collectAncestorScopeIds(index, selectedScopeId, treeMode), selectedScopeId])]
    : [];

  const entityIds = selectedEntityIds.flatMap((entityId) => collectSafeNavigationAncestorEntityIds(index, entityId));

  if (scopeIds.length === 0 && entityIds.length === 0) {
    return computeCollapsedAutoExpandState(index, treeMode);
  }

  return {
    scopeIds,
    entityIds: [...new Set(entityIds)],
  };
}
export function computeCollapsedAutoExpandState(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode = 'advanced'): BrowserNavigationAutoExpandState {
  if (!index) {
    return { scopeIds: [], entityIds: [] };
  }
  return computeSingleChildAutoExpandState(index, treeMode);
}

export function computeCollapsedScopeIds(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode = 'advanced') {
  return computeCollapsedAutoExpandState(index, treeMode).scopeIds;
}

export function collectNavigationSearchVisibility(
  index: BrowserSnapshotIndex,
  treeMode: BrowserTreeMode,
  searchResults: BrowserSearchResult[],
): BrowserNavigationSearchVisibility {
  const scopeIds = new Set<string>();
  const entityIds = new Set<string>();

  const addScopePath = (scopeId: string | null) => {
    if (!scopeId || !isScopeVisibleInTreeMode(index, scopeId, treeMode)) {
      return;
    }
    scopeIds.add(scopeId);
    for (const ancestorId of collectAncestorScopeIds(index, scopeId, treeMode)) {
      scopeIds.add(ancestorId);
    }
  };

  const addEntityPath = (entityId: string) => {
    const entity = index.entitiesById.get(entityId);
    if (!entity) {
      return;
    }
    entityIds.add(entityId);
    addScopePath(entity.scopeId);
    for (const ancestorEntityId of collectSafeNavigationAncestorEntityIds(index, entityId)) {
      entityIds.add(ancestorEntityId);
      const ancestorEntity = index.entitiesById.get(ancestorEntityId);
      if (ancestorEntity?.scopeId) {
        addScopePath(ancestorEntity.scopeId);
      }
    }
  };

  for (const result of searchResults) {
    if (result.kind === 'entity') {
      addEntityPath(result.id);
      continue;
    }
    if (result.kind === 'scope') {
      addScopePath(result.id);
      continue;
    }
    addScopePath(result.scopeId);
  }

  return { scopeIds, entityIds };
}

export function filterRootsForSearch(
  roots: BrowserScopeTreeNode[],
  visibleScopeIds: Set<string> | null,
) {
  if (!visibleScopeIds) {
    return roots;
  }
  return roots.filter((node) => visibleScopeIds.has(node.scopeId));
}
