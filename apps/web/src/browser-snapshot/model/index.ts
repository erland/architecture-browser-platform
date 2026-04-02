/**
 * Internal model surface for the browser-snapshot subsystem.
 *
 * This is the preferred internal home for snapshot index types and
 * index build/cache helpers. Public consumers should continue to import from
 * `browser-snapshot` unless they specifically need an internal stage surface.
 */

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
} from './types';

export {
  buildBrowserSnapshotIndex,
  clearBrowserSnapshotIndex,
  getOrBuildBrowserSnapshotIndex,
} from './build';
