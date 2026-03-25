import { platformApi } from '../../platformApi';
import { parseSavedCanvasJson, type SavedCanvasDocument } from '../model/document';

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
  updateCanvas(workspaceId: string, snapshotId: string, document: SavedCanvasDocument, expectedBackendVersion?: string | null): Promise<SavedCanvasRemoteRecord>;
  duplicateCanvas(workspaceId: string, snapshotId: string, canvasId: string): Promise<SavedCanvasRemoteRecord>;
  deleteCanvas(workspaceId: string, snapshotId: string, canvasId: string, expectedBackendVersion?: string | null): Promise<void>;
}

function toSavedCanvasRemoteRecord(response: SavedCanvasBackendResponse): SavedCanvasRemoteRecord {
  const parsedDocument = parseSavedCanvasJson(response.documentJson);
  if (!parsedDocument) {
    throw new Error(`Saved canvas ${response.id} returned invalid document JSON.`);
  }
  const document = parsedDocument.canvasId === response.id
    ? parsedDocument
    : { ...parsedDocument, canvasId: response.id };
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
    async updateCanvas(workspaceId, snapshotId, document, expectedBackendVersion) {
      return toSavedCanvasRemoteRecord(await api.updateSavedCanvas<SavedCanvasBackendResponse>(workspaceId, snapshotId, document.canvasId, {
        name: document.name,
        document,
        expectedBackendVersion: expectedBackendVersion ?? document.sync.backendVersion ?? null,
      }));
    },
    async duplicateCanvas(workspaceId, snapshotId, canvasId) {
      return toSavedCanvasRemoteRecord(await api.duplicateSavedCanvas<SavedCanvasBackendResponse>(workspaceId, snapshotId, canvasId));
    },
    async deleteCanvas(workspaceId, snapshotId, canvasId, expectedBackendVersion) {
      await api.deleteSavedCanvas(workspaceId, snapshotId, canvasId, expectedBackendVersion ?? null);
    },
  };
}
