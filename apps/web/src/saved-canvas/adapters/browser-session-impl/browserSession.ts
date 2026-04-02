import type { FullSnapshotPayload } from '../../../app-model';
import type { BrowserSnapshotIndex } from '../../../browser-snapshot';

/**
 * Explicit browser-session port used by the saved-canvas subsystem.
 *
 * Saved-canvas browser-state mapping should depend on this narrow contract
 * rather than importing browser-session store types directly.
 */
export type SavedCanvasBrowserCanvasNode = {
  kind: 'scope' | 'entity';
  id: string;
  x: number;
  y: number;
  pinned?: boolean;
  manuallyPlaced?: boolean;
};

export type SavedCanvasBrowserCanvasEdge = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
};

export type SavedCanvasBrowserCanvasLayoutMode = 'grid' | 'radial' | 'structure' | 'balanced' | 'flow' | 'hierarchy';

export type SavedCanvasBrowserCanvasViewport = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type SavedCanvasBrowserViewpointSelection = {
  viewpointId: string | null;
};

export type SavedCanvasBrowserSessionSnapshot = {
  workspaceId: string;
  repositoryId: string | null;
  snapshotId: string;
  snapshotKey: string;
  preparedAt: string;
};

export type SavedCanvasBrowserSessionState = {
  activeSnapshot: SavedCanvasBrowserSessionSnapshot | null;
  payload: FullSnapshotPayload | null;
  index: BrowserSnapshotIndex | null;
  canvasNodes: SavedCanvasBrowserCanvasNode[];
  canvasEdges: SavedCanvasBrowserCanvasEdge[];
  viewpointSelection: SavedCanvasBrowserViewpointSelection;
  canvasLayoutMode: SavedCanvasBrowserCanvasLayoutMode;
  canvasViewport: SavedCanvasBrowserCanvasViewport;
};

export type SavedCanvasOpenBrowserSessionOptions = {
  workspaceId: string;
  repositoryId: string | null;
  payload: FullSnapshotPayload;
  preparedAt?: string;
  keepViewState?: boolean;
};

export type SavedCanvasBrowserSessionLifecyclePort = {
  createEmptyState: () => SavedCanvasBrowserSessionState;
  openSnapshotSession: (
    state: SavedCanvasBrowserSessionState,
    options: SavedCanvasOpenBrowserSessionOptions,
  ) => SavedCanvasBrowserSessionState;
};
