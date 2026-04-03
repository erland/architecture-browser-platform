import type { SavedCanvasDocument, SavedCanvasSyncState } from '../../domain/model/document';

/**
 * Application-owned persistence ports for the saved-canvas subsystem.
 *
 * The application layer depends on these contracts rather than adapter-impl
 * module paths so sync/opening/browser workflows remain independent from the
 * concrete storage implementations.
 */
export type SavedCanvasLocalRecord = {
  canvasId: string;
  name: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  originSnapshotId: string;
  currentTargetSnapshotId: string | null;
  snapshotKey: string;
  syncState: SavedCanvasSyncState;
  localVersion: number;
  backendVersion?: string | null;
  updatedAt?: string;
  lastModifiedAt: string;
  lastSyncedAt?: string | null;
  document: SavedCanvasDocument;
};

export interface SavedCanvasLocalStorage {
  get(canvasId: string): Promise<SavedCanvasLocalRecord | null>;
  put(document: SavedCanvasDocument): Promise<SavedCanvasLocalRecord>;
  has(canvasId: string): Promise<boolean>;
  remove(canvasId: string): Promise<void>;
  clear(): Promise<void>;
  list(): Promise<SavedCanvasLocalRecord[]>;
}

export type SavedCanvasLocalListFilter = {
  workspaceId?: string | null;
  repositoryRegistrationId?: string | null;
  snapshotId?: string | null;
  includeDeletedPendingSync?: boolean;
};

export interface SavedCanvasLocalStore {
  getCanvas(canvasId: string): Promise<SavedCanvasLocalRecord | null>;
  putCanvas(document: SavedCanvasDocument): Promise<SavedCanvasLocalRecord>;
  hasCanvas(canvasId: string): Promise<boolean>;
  deleteCanvas(canvasId: string): Promise<void>;
  clearAll(): Promise<void>;
  listCanvases(filter?: SavedCanvasLocalListFilter): Promise<SavedCanvasLocalRecord[]>;
}

export type SavedCanvasRemoteRecord = {
  canvasId: string;
  workspaceId: string;
  snapshotId: string;
  name: string;
  document: SavedCanvasDocument;
  documentVersion: number;
  backendVersion: string;
  createdAt: string;
  updatedAt: string;
};

export interface SavedCanvasRemoteStore {
  listCanvases(workspaceId: string, snapshotId: string): Promise<SavedCanvasRemoteRecord[]>;
  getCanvas(workspaceId: string, snapshotId: string, canvasId: string): Promise<SavedCanvasRemoteRecord>;
  createCanvas(workspaceId: string, snapshotId: string, document: SavedCanvasDocument): Promise<SavedCanvasRemoteRecord>;
  updateCanvas(workspaceId: string, snapshotId: string, document: SavedCanvasDocument, expectedBackendVersion?: string | null): Promise<SavedCanvasRemoteRecord>;
  duplicateCanvas(workspaceId: string, snapshotId: string, canvasId: string): Promise<SavedCanvasRemoteRecord>;
  deleteCanvas(workspaceId: string, snapshotId: string, canvasId: string, expectedBackendVersion?: string | null): Promise<void>;
}
