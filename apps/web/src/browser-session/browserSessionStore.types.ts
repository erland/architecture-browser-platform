import type { FullSnapshotPayload } from '../app-model';
import type {
  BrowserDependencyDirection,
  BrowserResolvedViewpointGraph,
  BrowserSearchResult,
  BrowserSnapshotIndex,
  BrowserTreeMode,
  BrowserViewpointScopeMode,
  BrowserViewpointVariant,
} from '../browser-snapshot';

export type BrowserFactsPanelMode = 'hidden' | 'scope' | 'entity' | 'relationship';
export type BrowserFactsPanelLocation = 'right' | 'bottom' | 'replace-canvas';
export type BrowserFocusedElement =
  | { kind: 'scope'; id: string }
  | { kind: 'entity'; id: string }
  | { kind: 'relationship'; id: string }
  | null;

export type BrowserCanvasNode = {
  kind: 'scope' | 'entity';
  id: string;
  x: number;
  y: number;
  pinned?: boolean;
  manuallyPlaced?: boolean;
};

export type BrowserCanvasLayoutMode = 'grid' | 'radial' | 'structure' | 'balanced' | 'flow' | 'hierarchy';

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

export type BrowserRoutingFeatureFlags = {
  orthogonalRouting: boolean;
  laneSeparation: boolean;
  postLayoutCleanup: boolean;
};

export type BrowserRoutingConservativeDefaults = {
  gridSize: number;
  obstacleMargin: number;
  laneSpacing: number;
  maxChannelShiftSteps: number;
  endpointStubLength: number;
  maxLaneCountForSpacing: number;
};

export type BrowserRoutingLayoutConfig = {
  features: BrowserRoutingFeatureFlags;
  defaults: BrowserRoutingConservativeDefaults;
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
  canvasViewport: BrowserCanvasViewport;
  fitViewRequestedAt: string | null;
  routeRefreshRequestedAt: string | null;
  routingLayoutConfig: BrowserRoutingLayoutConfig;
};

export type PersistedBrowserSessionState = {
  activeSnapshot: BrowserSessionSnapshot | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  searchQuery: string;
  searchScopeId: string | null;
  canvasNodes: BrowserCanvasNode[];
  canvasEdges: BrowserCanvasEdge[];
  focusedElement: BrowserFocusedElement;
  factsPanelMode: BrowserFactsPanelMode;
  factsPanelLocation: BrowserFactsPanelLocation;
  graphExpansionActions: BrowserGraphExpansionAction[];
  viewpointSelection: BrowserViewpointSelection;
  viewpointPresentationPreference: BrowserViewpointPresentationPreference;
  canvasLayoutMode: BrowserCanvasLayoutMode;
  treeMode: BrowserTreeMode;
  canvasViewport: BrowserCanvasViewport;
  routingLayoutConfig: BrowserRoutingLayoutConfig;
};
