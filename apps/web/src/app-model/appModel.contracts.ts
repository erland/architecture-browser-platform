import type { SavedCanvasDocument } from '../saved-canvas/domain';
import type { RepositorySourceType, TriggerType } from './appModel.api';

/**
 * Cross-layer frontend contracts shared by API transport, app-model forms,
 * Browser workflows, and saved-canvas adapters.
 *
 * These types intentionally live outside `api/` so request/response shapes do
 * not drift from the rest of the frontend model.
 */
export type WorkspaceCreateRequest = {
  workspaceKey: string;
  name: string;
  description: string;
};

export type WorkspaceUpdateRequest = {
  name: string;
  description: string;
};

export type RepositoryUpsertRequest = {
  name: string;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};

export type RepositoryCreateRequest = RepositoryUpsertRequest & {
  repositoryKey: string;
  sourceType: RepositorySourceType;
};

export type RepositoryUpdateRequest = RepositoryUpsertRequest;

export type RunRequest = {
  triggerType: TriggerType;
  requestedSchemaVersion: string;
  requestedIndexerVersion: string;
  metadataJson: string;
  requestedResult: 'SUCCESS' | 'FAILURE';
};

export type SavedCanvasUpsertRequest = {
  name: string;
  document: SavedCanvasDocument;
  expectedBackendVersion?: string | null;
};

export type SavedCanvasBackendResponseDto = {
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

export function buildSavedCanvasUpsertRequest(
  document: SavedCanvasDocument,
  expectedBackendVersion?: string | null,
): SavedCanvasUpsertRequest {
  return expectedBackendVersion == null
    ? {
        name: document.name,
        document,
      }
    : {
        name: document.name,
        document,
        expectedBackendVersion,
      };
}
