import type { BrowserTreeMode } from '../../browser-snapshot';

export type BrowserScopeCategoryGroup = {
  kind: string;
  label: string;
  nodes: import('../../browser-snapshot').BrowserScopeTreeNode[];
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

export const TREE_MODE_META: Record<BrowserTreeMode, { label: string; description: string }> = {
  filesystem: { label: 'Filesystem', description: 'Directory and file structure' },
  package: { label: 'Package', description: 'Package-focused structure' },
  advanced: { label: 'All scopes', description: 'Full scope/debug view' },
};

export function toCategoryLabel(kind: string) {
  return kind.replace(/_/g, ' ').toLocaleLowerCase().replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase());
}
