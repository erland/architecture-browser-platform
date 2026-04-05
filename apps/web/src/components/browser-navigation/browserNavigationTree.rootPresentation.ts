import { detectDefaultBrowserTreeMode, type BrowserSnapshotIndex, type BrowserScopeTreeNode, type BrowserTreeMode } from '../../browser-snapshot';

export type BrowserNavigationRootPresentation = {
  effectiveTreeMode: BrowserTreeMode;
  defaultBrowsableTreeMode: BrowserTreeMode;
  roots: BrowserScopeTreeNode[];
};

export const BROWSABLE_TREE_MODES: BrowserTreeMode[] = ['filesystem', 'package'];

export function resolveBrowsableNavigationTreeMode(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode): BrowserTreeMode {
  if (treeMode !== 'advanced') {
    return treeMode;
  }
  if (!index) {
    return 'filesystem';
  }
  const detected = detectDefaultBrowserTreeMode(index);
  return detected === 'package' ? 'package' : 'filesystem';
}

export function filterNavigationRootsForVisibility(
  roots: BrowserScopeTreeNode[],
  visibleScopeIds: Set<string> | null,
): BrowserScopeTreeNode[] {
  if (!visibleScopeIds) {
    return roots;
  }
  return roots.filter((node) => visibleScopeIds.has(node.scopeId));
}

export function computeNavigationRootPresentation(args: {
  index: BrowserSnapshotIndex | null;
  treeMode: BrowserTreeMode;
  roots: BrowserScopeTreeNode[];
  visibleScopeIds?: Set<string> | null;
}): BrowserNavigationRootPresentation {
  const effectiveTreeMode = resolveBrowsableNavigationTreeMode(args.index, args.treeMode);
  return {
    effectiveTreeMode,
    defaultBrowsableTreeMode: effectiveTreeMode,
    roots: filterNavigationRootsForVisibility(args.roots, args.visibleScopeIds ?? null),
  };
}
