import type {
  BrowserCanvasEdge,
  BrowserCanvasNode,
  BrowserCanvasLayoutMode,
  BrowserFocusedElement,
  BrowserSessionState,
} from '../browserSessionStore.types';
import type { BrowserCanvasPlacementOptions } from '../browser-canvas-placement';

export type BrowserAutoLayoutMode = 'structure' | 'balanced' | 'flow' | 'hierarchy';

export type BrowserAutoLayoutCleanupIntensity = 'none' | 'basic' | 'compact';

export type BrowserAutoLayoutConfig = {
  defaultMode: BrowserAutoLayoutMode;
  horizontalSpacing: number;
  verticalSpacing: number;
  componentSpacing: number;
  maxBreadth: number;
  pinnedNodesAreHardAnchors: boolean;
  manualNodesAreHardAnchors: boolean;
  cleanupIntensity: BrowserAutoLayoutCleanupIntensity;
  enableOrderingHeuristics: boolean;
};

export type BrowserAutoLayoutNode = {
  kind: BrowserCanvasNode['kind'];
  id: string;
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  manuallyPlaced: boolean;
  selected: boolean;
  focused: boolean;
  anchored: boolean;
  scopeId: string | null;
  inboundCount: number;
  outboundCount: number;
  incidentCount: number;
};

export type BrowserAutoLayoutEdge = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  kind: string | null;
  label: string | null;
};

export type BrowserAutoLayoutComponent = {
  id: string;
  nodeIds: string[];
  edgeIds: string[];
  anchoredNodeIds: string[];
  nodeCount: number;
  edgeCount: number;
};

export type BrowserAutoLayoutGraph = {
  nodes: BrowserAutoLayoutNode[];
  edges: BrowserAutoLayoutEdge[];
  focusedNodeId: string | null;
  anchorNodeId: string | null;
  selectedNodeIds: string[];
  components: BrowserAutoLayoutComponent[];
  nodeToComponentId: Record<string, string>;
};

export type BrowserAutoLayoutRequest = {
  mode: BrowserAutoLayoutMode;
  nodes: BrowserCanvasNode[];
  edges: BrowserCanvasEdge[];
  options?: BrowserCanvasPlacementOptions;
  state?: BrowserSessionState;
  config?: Partial<BrowserAutoLayoutConfig>;
};

export type BrowserAutoLayoutResult = {
  mode: BrowserAutoLayoutMode;
  canvasLayoutMode: BrowserCanvasLayoutMode;
  nodes: BrowserCanvasNode[];
};

export function getFocusedAutoLayoutNodeId(focusedElement: BrowserFocusedElement): string | null {
  return focusedElement?.kind === 'entity' || focusedElement?.kind === 'scope'
    ? focusedElement.id
    : null;
}
