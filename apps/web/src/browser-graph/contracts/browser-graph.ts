/**
 * Canonical shared contract barrel for the browser graph pipeline.
 *
 * Owns the cross-stage type contracts shared by projection, workspace,
 * placement, layout, routing, and graph-workspace rendering.
 *
 * Graph-pipeline stages import these contracts instead of reaching into
 * browser-session internals directly.
 */

import type { FullSnapshotPayload } from '../../app-model';
import type {
  BrowserDependencyDirection,
  BrowserResolvedViewpointGraph,
  BrowserSearchResult,
  BrowserSnapshotIndex,
  BrowserTreeMode,
  BrowserViewpointScopeMode,
  BrowserViewpointVariant,
} from '../../browser-snapshot';
import type { BrowserRoutingLayoutConfig } from '../routing/browserRoutingLayoutConfig';

export type BrowserFactsPanelMode = 'hidden' | 'scope' | 'entity' | 'relationship';
export type BrowserFactsPanelLocation = 'right' | 'bottom' | 'replace-canvas';

export type BrowserFocusedElement =
  | { kind: 'scope'; id: string }
  | { kind: 'entity'; id: string }
  | { kind: 'relationship'; id: string }
  | null;

export type BrowserClassPresentationMode = 'simple' | 'compartments' | 'expanded';

export type BrowserClassPresentationPolicy = {
  mode: BrowserClassPresentationMode;
  showFields: boolean;
  showFunctions: boolean;
};

export type BrowserCanvasNode = {
  kind: 'scope' | 'entity';
  id: string;
  x: number;
  y: number;
  pinned?: boolean;
  manuallyPlaced?: boolean;
  classPresentation?: BrowserClassPresentationPolicy;
};

export type BrowserCanvasLayoutMode = 'grid' | 'radial' | 'structure' | 'balanced' | 'flow' | 'hierarchy';

export type BrowserNavigationTreeViewState = {
  expandedScopeIds: string[];
  expandedCategories: string[];
  expandedEntityIds: string[];
  expandedChildListNodeIds: string[];
};

export type BrowserCanvasViewport = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type BrowserViewpointApplyMode = 'replace' | 'merge';

export type BrowserViewpointSelection = {
  viewpointId: string | null;
  scopeMode: BrowserViewpointScopeMode;
  applyMode: BrowserViewpointApplyMode;
  variant: BrowserViewpointVariant;
};

export type BrowserViewpointPresentationPreference = 'auto' | 'entity-graph' | 'compact-uml';

export type BrowserCanvasEdge = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
};

export type BrowserGraphExpansionAction = {
  type: 'dependencies';
  entityId: string;
  direction: BrowserDependencyDirection;
  appliedAt: string;
};

export type BrowserSessionSnapshot = {
  workspaceId: string;
  repositoryId: string | null;
  snapshotId: string;
  snapshotKey: string;
  preparedAt: string;
};

/**
 * Shared graph/session state contract for graph-pipeline stages.
 *
 * This is intentionally owned by `browser-graph/contracts` rather than
 * aliasing `browser-session/model/types`, so graph stages have a stable,
 * graph-owned schema boundary.
 */
export type BrowserSessionState = {
  activeSnapshot: BrowserSessionSnapshot | null;
  payload: FullSnapshotPayload | null;
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  searchQuery: string;
  searchScopeId: string | null;
  searchResults: BrowserSearchResult[];
  canvasNodes: BrowserCanvasNode[];
  canvasEdges: BrowserCanvasEdge[];
  focusedElement: BrowserFocusedElement;
  factsPanelMode: BrowserFactsPanelMode;
  factsPanelLocation: BrowserFactsPanelLocation;
  graphExpansionActions: BrowserGraphExpansionAction[];
  viewpointSelection: BrowserViewpointSelection;
  appliedViewpoint: BrowserResolvedViewpointGraph | null;
  viewpointPresentationPreference: BrowserViewpointPresentationPreference;
  canvasLayoutMode: BrowserCanvasLayoutMode;
  treeMode: BrowserTreeMode;
  navigationTreeState: BrowserNavigationTreeViewState;
  canvasViewport: BrowserCanvasViewport;
  fitViewRequestedAt: string | null;
  routeRefreshRequestedAt: string | null;
  routingLayoutConfig: BrowserRoutingLayoutConfig;
};

/**
 * Shared session-shaped contract for graph-pipeline stages.
 */
export type BrowserGraphPipelineState = BrowserSessionState;

/** Shared canvas-shaped contracts for graph-pipeline stages. */
export type BrowserGraphCanvasNode = BrowserCanvasNode;
export type BrowserGraphCanvasEdge = BrowserCanvasEdge;
export type BrowserGraphFocusedElement = BrowserFocusedElement;
export type BrowserGraphCanvasLayoutMode = BrowserCanvasLayoutMode;

/**
 * Layout and placement contracts should depend on this alias instead of the
 * broader session-named type.
 */
export type BrowserGraphPlacementState = BrowserGraphPipelineState;
