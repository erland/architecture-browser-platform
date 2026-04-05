// Compatibility barrel for legacy navigation-tree imports.
// Prefer importing from the focused modules in this directory for new internal code.

export type {
  BrowserNavigationChildNode,
  BrowserNavigationEntityNode,
  BrowserNavigationScopeNode,
  BrowserNavigationSearchVisibility,
  BrowserScopeCategoryGroup,
} from './browserNavigationTree.shared';
export { TREE_MODE_META, toCategoryLabel } from './browserNavigationTree.shared';

export {
  buildNavigationChildNodes,
  buildNavigationEntityChildNodes,
} from './browserNavigationTree.nodes';

export {
  buildScopeCategoryGroups,
  collectAllExpandableEntityIds,
  collectAllVisibleScopeIds,
  collectAncestorScopeIds,
  collectSafeNavigationAncestorEntityIds,
  computeCollapsedAutoExpandState,
  computeCollapsedScopeIds,
  computeDefaultExpandedCategories,
  computeDefaultExpandedScopeIds,
  computeFocusExpandedState,
  computeSingleChildAutoExpandState,
} from './browserNavigationTree.expansion';

export {
  collectNavigationSearchVisibility,
  filterRootsForSearch,
} from './browserNavigationTree.search';

export { buildNavigationTreeSummary } from './browserNavigationTree.summary';
