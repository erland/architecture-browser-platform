export type BrowserRoutingPoint = {
  x: number;
  y: number;
};

export type BrowserRoutingNodeObstacle = {
  nodeId: string;
  kind: 'scope' | 'entity' | 'uml-class';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BrowserRoutingNodeFrame = BrowserRoutingNodeObstacle;

export type BrowserRoutingAnchorSide = 'left' | 'right' | 'top' | 'bottom';

export type BrowserEdgeRoutingInput = {
  relationshipId: string;
  fromNodeId: string;
  toNodeId: string;
  sourceRect: BrowserRoutingNodeObstacle;
  targetRect: BrowserRoutingNodeObstacle;
  defaultStart: BrowserRoutingPoint;
  defaultEnd: BrowserRoutingPoint;
  preferredStartSide: BrowserRoutingAnchorSide;
  preferredEndSide: BrowserRoutingAnchorSide;
  selfLoop: boolean;
  obstacleNodeIds: string[];
  obstacles: BrowserRoutingNodeObstacle[];
};

export type BrowserRoutingScene = {
  obstacles: BrowserRoutingNodeObstacle[];
  inputsByRelationshipId: Record<string, BrowserEdgeRoutingInput>;
};
