import type { BrowserViewpointPresentationPolicy } from '../browser-graph/presentation';

export type BrowserProjectionNodeKind = 'scope' | 'entity' | 'uml-class';
export type BrowserProjectionCompartmentKind = 'attributes' | 'operations';
export type BrowserProjectionEdgeSemanticStyle = 'containment';

export type BrowserProjectionSource =
  | { kind: 'scope'; id: string }
  | { kind: 'entity'; id: string };

export type BrowserProjectionCompartmentItem = {
  entityId: string;
  kind: string;
  title: string;
  subtitle: string;
  selected: boolean;
  focused: boolean;
};

export type BrowserProjectionCompartment = {
  kind: BrowserProjectionCompartmentKind;
  items: BrowserProjectionCompartmentItem[];
};

export type BrowserProjectionNode = {
  classPresentationMode?: 'simple' | 'compartments' | 'expanded';
  classVisibleCompartmentKinds?: BrowserProjectionCompartmentKind[];
  isExpandedClassMember?: boolean;
  parentClassEntityId?: string;
  memberKind?: string;
  id: string;
  kind: BrowserProjectionNodeKind;
  source: BrowserProjectionSource;
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

export type BrowserProjectionEdge = {
  id: string;
  relationshipId: string;
  fromNodeId: string;
  toNodeId: string;
  fromEntityId: string;
  toEntityId: string;
  label?: string;
  fromLabel?: string;
  toLabel?: string;
  semanticStyle?: BrowserProjectionEdgeSemanticStyle;
  focused: boolean;
};

export type BrowserProjectionModel = {
  width: number;
  height: number;
  nodes: BrowserProjectionNode[];
  edges: BrowserProjectionEdge[];
  presentationPolicy: BrowserViewpointPresentationPolicy;
  suppressedEntityIds: string[];
};

export type BrowserNodeFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};
