import {
  buildSavedCanvasUpsertRequest,
  type SavedCanvasBackendResponseDto,
} from '../../../app-model';
import { platformApi } from '../../../api/platformApi';
import { parseSavedCanvasJson, type SavedCanvasDocument } from '../../domain/model/document';
import type { SavedCanvasRemoteRecord, SavedCanvasRemoteStore } from '../../application/ports/storage';

function toSavedCanvasRemoteRecord(response: SavedCanvasBackendResponseDto): SavedCanvasRemoteRecord {
  const parsedDocument = parseSavedCanvasJson(response.documentJson);
  if (!parsedDocument) {
    throw new Error(`Saved canvas ${response.id} returned invalid document JSON.`);
  }
  const document: SavedCanvasDocument = parsedDocument.canvasId === response.id
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
      const responses = await api.listSavedCanvases<SavedCanvasBackendResponseDto[]>(workspaceId, snapshotId);
      return responses.map(toSavedCanvasRemoteRecord);
    },
    async getCanvas(workspaceId, snapshotId, canvasId) {
      return toSavedCanvasRemoteRecord(await api.getSavedCanvas<SavedCanvasBackendResponseDto>(workspaceId, snapshotId, canvasId));
    },
    async createCanvas(workspaceId, snapshotId, document) {
      return toSavedCanvasRemoteRecord(await api.createSavedCanvas<SavedCanvasBackendResponseDto>(workspaceId, snapshotId, buildSavedCanvasUpsertRequest(document)));
    },
    async updateCanvas(workspaceId, snapshotId, document, expectedBackendVersion) {
      return toSavedCanvasRemoteRecord(await api.updateSavedCanvas<SavedCanvasBackendResponseDto>(workspaceId, snapshotId, document.canvasId, buildSavedCanvasUpsertRequest(
        document,
        expectedBackendVersion ?? document.sync.backendVersion ?? null,
      )));
    },
    async duplicateCanvas(workspaceId, snapshotId, canvasId) {
      return toSavedCanvasRemoteRecord(await api.duplicateSavedCanvas<SavedCanvasBackendResponseDto>(workspaceId, snapshotId, canvasId));
    },
    async deleteCanvas(workspaceId, snapshotId, canvasId, expectedBackendVersion) {
      await api.deleteSavedCanvas(workspaceId, snapshotId, canvasId, expectedBackendVersion ?? null);
    },
  };
}
