import type { BrowserProjectionCompartment } from '../../browser-projection';
import { buildBrowserProjectionModel } from '../../browser-projection';
import type { BrowserEdgeRoutingInput, BrowserRoutingScene } from '../../browser-routing';
import type { BrowserSessionState } from '../../browser-session';
import { syncMeaningfulCanvasEdges } from '../../browser-session/canvas/relationships';
import { buildWorkspaceNodes, compareWorkspaceNodes, normalizeProjectionEdgesForWorkspace } from './browserGraphWorkspaceProjection';
import { buildWorkspaceRouting, compareWorkspaceEdges } from './browserGraphWorkspaceRouting';

export type BrowserWorkspaceNodeModel = {
  classPresentationMode?: 'simple' | 'compartments' | 'expanded';
  classVisibleCompartmentKinds?: ('attributes' | 'operations')[];
  isExpandedClassMember?: boolean;
  parentClassEntityId?: string;
  memberKind?: string;
  id: string;
  kind: 'scope' | 'entity' | 'uml-class';
  badgeLabel: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  selected: boolean;
  focused: boolean;
  memberEntityIds: string[];
  compartments: BrowserProjectionCompartment[];
};

export type BrowserWorkspaceEdgePoint = {
  x: number;
  y: number;
};

export type BrowserWorkspaceEdgeRoute = {
  kind: 'straight' | 'polyline';
  points: BrowserWorkspaceEdgePoint[];
  path: string;
  labelPosition: BrowserWorkspaceEdgePoint;
};

export type BrowserWorkspaceEdgeModel = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  label: string;
  route: BrowserWorkspaceEdgeRoute;
  routingInput: BrowserEdgeRoutingInput;
  laneIndex: number;
  laneOffset: number;
  focused: boolean;
};

export type BrowserGraphWorkspaceModel = {
  routingScene: BrowserRoutingScene;
  routingRevision: string;
  width: number;
  height: number;
  nodes: BrowserWorkspaceNodeModel[];
  edges: BrowserWorkspaceEdgeModel[];
  presentationMode: 'entity-graph' | 'compact-uml';
  suppressedEntityIds: string[];
};

export function buildBrowserGraphWorkspaceModel(state: BrowserSessionState): BrowserGraphWorkspaceModel {
  const effectiveCanvasEdges = syncMeaningfulCanvasEdges(state);
  const projection = buildBrowserProjectionModel({
    ...state,
    canvasEdges: effectiveCanvasEdges,
  });
  const normalizedProjectionEdges = normalizeProjectionEdgesForWorkspace(projection.nodes, projection.edges);
  const nodes = buildWorkspaceNodes(projection.nodes);
  const routing = buildWorkspaceRouting(state, nodes, normalizedProjectionEdges);

  return {
    width: projection.width,
    height: projection.height,
    presentationMode: projection.presentationPolicy.mode,
    suppressedEntityIds: projection.suppressedEntityIds,
    routingScene: routing.routingScene,
    routingRevision: routing.routingRevision,
    nodes: nodes.slice().sort(compareWorkspaceNodes),
    edges: routing.edges.slice().sort(compareWorkspaceEdges),
  };
}
