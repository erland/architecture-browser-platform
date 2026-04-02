export type {
  BrowserDependencyDirection,
  BrowserDependencyEdge,
  BrowserDependencyNeighborhood,
  BrowserEntityFacts,
  BrowserNodeKind,
  BrowserResolvedViewpointGraph,
  BrowserScopeFacts,
  BrowserScopeTreeNode,
  BrowserSearchDocument,
  BrowserSearchResult,
  BrowserSearchResultKind,
  BrowserSnapshotIndex,
  BrowserTreeMode,
  BrowserViewpointScopeMode,
  BrowserViewpointVariant,
} from './browserSnapshotIndex.types';

export {
  buildBrowserSnapshotIndex,
  clearBrowserSnapshotIndex,
  getOrBuildBrowserSnapshotIndex,
} from './browserSnapshotIndex.build';

export {
  collectVisibleAncestorScopeIds,
  detectDefaultBrowserTreeMode,
  getChildScopes,
  getContainedEntitiesForEntity,
  getContainingEntitiesForEntity,
  getContainingScopesForEntity,
  getDependencyNeighborhood,
  getDirectEntitiesForScope,
  getDirectEntitiesForScopeByKind,
  getEntityFacts,
  getPrimaryEntitiesForScope,
  getScopeChildren,
  getScopeFacts,
  getScopeTreeNodesForMode,
  getScopeTreeRoots,
  getSubtreeEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
  isScopeVisibleInTreeMode,
} from './query/scopeQueries';

export { searchBrowserSnapshotIndex } from './query/search';

export {
  buildViewpointGraph,
  getAvailableViewpoints,
  getViewpointById,
  resolveViewpointExpansionRelationships,
  resolveViewpointSeedEntityIds,
} from './viewpoints';
