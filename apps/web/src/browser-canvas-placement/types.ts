import type { BrowserCanvasNode, BrowserGraphPlacementState } from '../browser-graph/contracts';

export type BrowserCanvasPlacement = { x: number; y: number };

export type BrowserCanvasBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type BrowserCanvasNodeLike = Pick<BrowserCanvasNode, 'kind' | 'x' | 'y'>;
export type BrowserCanvasNodeSizeLike = BrowserCanvasNodeLike & Partial<Pick<BrowserCanvasNode, 'id'>>;

export type BrowserCanvasPlacementOptions = {
  state?: BrowserGraphPlacementState | null;
};
