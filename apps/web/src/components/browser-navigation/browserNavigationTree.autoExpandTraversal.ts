import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import {
  canExpandEntityInNavigationTree,
  getExpandableNavigationChildrenForEntity,
} from '../../browser-snapshot';

export type BrowserNavigationAutoExpandState = {
  scopeIds: string[];
  entityIds: string[];
};

export type BrowserNavigationAutoExpandParent = {
  scopeId?: string | null;
  entityId?: string | null;
};

export type BrowserNavigationAutoExpandTraversalInput = {
  index: BrowserSnapshotIndex;
  treeMode: BrowserTreeMode;
  parent?: BrowserNavigationAutoExpandParent;
  getScopeChildren: (parentScopeId: string | null, treeMode: BrowserTreeMode) => Array<
    | { nodeType: 'scope'; scopeId: string }
    | { nodeType: 'entity'; entityId: string; expandable: boolean }
  >;
};

function appendUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function collectSingleChildEntityChain(
  index: BrowserSnapshotIndex,
  entityId: string,
  state: BrowserNavigationAutoExpandState,
  seen: Set<string>,
) {
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
  collectSingleChildEntityChain(index, singleChild.externalId, state, seen);
}

function collectSingleChildScopeChain(
  index: BrowserSnapshotIndex,
  treeMode: BrowserTreeMode,
  scopeId: string | null,
  state: BrowserNavigationAutoExpandState,
  seen: Set<string>,
  getScopeChildren: BrowserNavigationAutoExpandTraversalInput['getScopeChildren'],
) {
  const seenKey = `scope:${scopeId ?? 'root'}`;
  if (seen.has(seenKey)) {
    return;
  }
  seen.add(seenKey);

  const children = getScopeChildren(scopeId, treeMode);
  if (children.length !== 1) {
    return;
  }

  const [singleChild] = children;
  if (singleChild.nodeType === 'scope') {
    appendUnique(state.scopeIds, singleChild.scopeId);
    collectSingleChildScopeChain(index, treeMode, singleChild.scopeId, state, seen, getScopeChildren);
    return;
  }

  if (!singleChild.expandable) {
    return;
  }

  appendUnique(state.entityIds, singleChild.entityId);
  collectSingleChildEntityChain(index, singleChild.entityId, state, seen);
}

export function computeSingleChildAutoExpandTraversalState({
  index,
  treeMode,
  parent = {},
  getScopeChildren,
}: BrowserNavigationAutoExpandTraversalInput): BrowserNavigationAutoExpandState {
  const state: BrowserNavigationAutoExpandState = { scopeIds: [], entityIds: [] };
  const seen = new Set<string>();

  if (parent.entityId) {
    collectSingleChildEntityChain(index, parent.entityId, state, seen);
    return state;
  }

  collectSingleChildScopeChain(index, treeMode, parent.scopeId ?? null, state, seen, getScopeChildren);
  return state;
}
