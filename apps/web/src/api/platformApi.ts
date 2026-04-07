import type {
  RepositoryCreateRequest,
  RepositoryUpdateRequest,
  RunRequest,
  SavedCanvasUpsertRequest,
  SnapshotSourceFileReadRequest,
  WorkspaceCreateRequest,
  WorkspaceUpdateRequest,
} from '../app-model';
import { httpClient } from './httpClient';

export function createPlatformApi(client = httpClient) {
  return {
    getHealth: <T>() => client.fetchJson<T>('/api/health', { method: 'GET' }),
    listWorkspaces: <T>() => client.fetchJson<T>('/api/workspaces', { method: 'GET' }),
    getWorkspaceRepositories: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories`, { method: 'GET' }),
    getWorkspaceRuns: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/runs/recent`, { method: 'GET' }),
    getWorkspaceSnapshots: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots`, { method: 'GET' }),
    getFullSnapshotPayload: <T>(workspaceId: string, snapshotId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/full`, { method: 'GET' }),
    readSnapshotSourceFile: <T>(workspaceId: string, payload: SnapshotSourceFileReadRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshot-source-files/read`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    createWorkspace: <T>(payload: WorkspaceCreateRequest) =>
      client.fetchJson<T>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateWorkspace: <T>(workspaceId: string, payload: WorkspaceUpdateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    archiveWorkspace: <T>(workspaceId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/archive`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    createRepository: <T>(workspaceId: string, payload: RepositoryCreateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateRepository: <T>(workspaceId: string, repositoryId: string, payload: RepositoryUpdateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories/${repositoryId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    archiveRepository: <T>(workspaceId: string, repositoryId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories/${repositoryId}/archive`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    requestRun: <T>(workspaceId: string, repositoryId: string, payload: RunRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories/${repositoryId}/runs`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    listSavedCanvases: <T>(workspaceId: string, snapshotId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases`, { method: 'GET' }),
    getSavedCanvas: <T>(workspaceId: string, snapshotId: string, savedCanvasId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}`, { method: 'GET' }),
    createSavedCanvas: <T>(workspaceId: string, snapshotId: string, payload: SavedCanvasUpsertRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateSavedCanvas: <T>(workspaceId: string, snapshotId: string, savedCanvasId: string, payload: SavedCanvasUpsertRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    duplicateSavedCanvas: <T>(workspaceId: string, snapshotId: string, savedCanvasId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    deleteSavedCanvas: (workspaceId: string, snapshotId: string, savedCanvasId: string, expectedBackendVersion?: string | null) =>
      client.fetchNoContent(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}${expectedBackendVersion ? `?expectedBackendVersion=${encodeURIComponent(expectedBackendVersion)}` : ''}`, {
        method: 'DELETE',
      }),
  };
}

export const platformApi = createPlatformApi();
