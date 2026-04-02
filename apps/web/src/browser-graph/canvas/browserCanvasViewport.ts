export type BrowserCanvasViewportLike = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type BrowserCanvasPointer = {
  x: number;
  y: number;
};

export type BrowserCanvasSize = {
  width: number;
  height: number;
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.2;
const FIT_VIEW_MAX_ZOOM = 1.4;
const FIT_VIEW_PADDING_X = 32;
const FIT_VIEW_PADDING_Y = 32;

export function clampCanvasZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function computeDraggedCanvasNodePosition(
  startPosition: { x: number; y: number },
  delta: { x: number; y: number },
  zoom: number,
) {
  const safeZoom = zoom > 0 ? zoom : 1;
  return {
    x: Math.round(startPosition.x + delta.x / safeZoom),
    y: Math.round(startPosition.y + delta.y / safeZoom),
  };
}

export function computePannedCanvasViewport(
  startViewport: BrowserCanvasViewportLike,
  delta: { x: number; y: number },
): BrowserCanvasViewportLike {
  return {
    ...startViewport,
    offsetX: Math.round(startViewport.offsetX + delta.x),
    offsetY: Math.round(startViewport.offsetY + delta.y),
  };
}

export function computeZoomedCanvasViewportAroundPointer(
  viewport: BrowserCanvasViewportLike,
  pointer: BrowserCanvasPointer,
  deltaY: number,
): BrowserCanvasViewportLike {
  const nextZoom = clampCanvasZoom(viewport.zoom * (deltaY < 0 ? 1.08 : 0.92));
  const worldX = (pointer.x - viewport.offsetX) / viewport.zoom;
  const worldY = (pointer.y - viewport.offsetY) / viewport.zoom;
  return {
    zoom: nextZoom,
    offsetX: pointer.x - worldX * nextZoom,
    offsetY: pointer.y - worldY * nextZoom,
  };
}

export function computeFitViewCanvasViewport(
  viewportSize: BrowserCanvasSize,
  contentSize: BrowserCanvasSize,
): BrowserCanvasViewportLike {
  const availableWidth = Math.max(320, viewportSize.width - FIT_VIEW_PADDING_X);
  const availableHeight = Math.max(240, viewportSize.height - FIT_VIEW_PADDING_Y);
  const zoomX = availableWidth / Math.max(contentSize.width, 1);
  const zoomY = availableHeight / Math.max(contentSize.height, 1);
  const fittedZoom = Math.min(FIT_VIEW_MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(zoomX, zoomY)));
  return {
    zoom: fittedZoom,
    offsetX: Math.round(Math.max(0, (viewportSize.width - contentSize.width * fittedZoom) / 2)),
    offsetY: Math.round(Math.max(0, (viewportSize.height - contentSize.height * fittedZoom) / 2)),
  };
}
