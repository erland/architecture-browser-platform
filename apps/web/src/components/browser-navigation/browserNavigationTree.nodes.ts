import {
  canExpandEntityInNavigationTree,
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
  type BrowserSnapshotIndex,
  type BrowserScopeTreeNode,
  type BrowserTreeMode,
} from '../../browser-snapshot';
import type { BrowserNavigationChildNode, BrowserNavigationEntityNode, BrowserNavigationScopeNode } from './browserNavigationTree.shared';
import { toCategoryLabel } from './browserNavigationTree.shared';

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
