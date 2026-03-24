import { platformApi } from './platformApi';
import { parseSavedCanvasJson, type SavedCanvasDocument } from './savedCanvasModel';

export type SavedCanvasBackendResponse = {
  id: string;
  workspaceId: string;
  snapshotId: string;
  name: string;
  documentJson: string;
  documentVersion: number;
  backendVersion: string;
  createdAt: string;
  updatedAt: string;
};

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
  updateCanvas(workspaceId: string, snapshotId: string, document: SavedCanvasDocument): Promise<SavedCanvasRemoteRecord>;
  duplicateCanvas(workspaceId: string, snapshotId: string, canvasId: string): Promise<SavedCanvasRemoteRecord>;
  deleteCanvas(workspaceId: string, snapshotId: string, canvasId: string): Promise<void>;
}

function toSavedCanvasRemoteRecord(response: SavedCanvasBackendResponse): SavedCanvasRemoteRecord {
  const document = parseSavedCanvasJson(response.documentJson);
  if (!document) {
    throw new Error(`Saved canvas ${response.id} returned invalid document JSON.`);
  }
  return {
    canvasId: response.id,
    workspaceId: response.workspaceId,
    snapshotId: response.snapshotId,
    name: response.name,
    document,
    documentVersion: response.documentVersion,
    backendVersion: response.backendVersion,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

export function createSavedCanvasRemoteStore(api = platformApi): SavedCanvasRemoteStore {
  return {
    async listCanvases(workspaceId, snapshotId) {
      const responses = await api.listSavedCanvases<SavedCanvasBackendResponse[]>(workspaceId, snapshotId);
      return responses.map(toSavedCanvasRemoteRecord);
    },
    async getCanvas(workspaceId, snapshotId, canvasId) {
      return toSavedCanvasRemoteRecord(await api.getSavedCanvas<SavedCanvasBackendResponse>(workspaceId, snapshotId, canvasId));
    },
    async createCanvas(workspaceId, snapshotId, document) {
      return toSavedCanvasRemoteRecord(await api.createSavedCanvas<SavedCanvasBackendResponse>(workspaceId, snapshotId, {
        name: document.name,
        document,
      }));
    },
    async updateCanvas(workspaceId, snapshotId, document) {
      return toSavedCanvasRemoteRecord(await api.updateSavedCanvas<SavedCanvasBackendResponse>(workspaceId, snapshotId, document.canvasId, {
        name: document.name,
        document,
      }));
    },
    async duplicateCanvas(workspaceId, snapshotId, canvasId) {
      return toSavedCanvasRemoteRecord(await api.duplicateSavedCanvas<SavedCanvasBackendResponse>(workspaceId, snapshotId, canvasId));
    },
    async deleteCanvas(workspaceId, snapshotId, canvasId) {
      await api.deleteSavedCanvas(workspaceId, snapshotId, canvasId);
    },
  };
}
