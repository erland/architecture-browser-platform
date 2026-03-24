import type { SavedCanvasDocument } from "./savedCanvasModel";
import { httpClient } from "./httpClient";

export type WorkspaceEditorRequest = {
  name: string;
  description: string;
};

export type RepositoryCreateRequest = {
  repositoryKey: string;
  name: string;
  sourceType: "LOCAL_PATH" | "GIT";
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};

export type RepositoryUpdateRequest = {
  name: string;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};

export type RunRequest = {
  triggerType: "MANUAL" | "SCHEDULED" | "IMPORT_ONLY" | "SYSTEM";
  requestedSchemaVersion: string;
  requestedIndexerVersion: string;
  metadataJson: string;
  requestedResult: "SUCCESS" | "FAILURE";
};

export type SavedViewCreateRequest = {
  name: string;
  viewType: string;
  queryState: Record<string, string>;
  layoutState: Record<string, string>;
};

export type SavedCanvasUpsertRequest = {
  name: string;
  document: SavedCanvasDocument;
};

export function createPlatformApi(client = httpClient) {
  return {
    getHealth: <T>() => client.fetchJson<T>("/api/health", { method: "GET" }),
    listWorkspaces: <T>() => client.fetchJson<T>("/api/workspaces", { method: "GET" }),
    getWorkspaceRepositories: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories`, { method: "GET" }),
    getWorkspaceRuns: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/runs/recent`, { method: "GET" }),
    getWorkspaceSnapshots: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots`, { method: "GET" }),
    getFullSnapshotPayload: <T>(workspaceId: string, snapshotId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/full`, { method: "GET" }),
    createWorkspace: <T>(payload: unknown) =>
      client.fetchJson<T>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateWorkspace: <T>(workspaceId: string, payload: WorkspaceEditorRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    archiveWorkspace: <T>(workspaceId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    createRepository: <T>(workspaceId: string, payload: RepositoryCreateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateRepository: <T>(workspaceId: string, repositoryId: string, payload: RepositoryUpdateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories/${repositoryId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    archiveRepository: <T>(workspaceId: string, repositoryId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories/${repositoryId}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    requestRun: <T>(workspaceId: string, repositoryId: string, payload: RunRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories/${repositoryId}/runs`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listSavedCanvases: <T>(workspaceId: string, snapshotId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases`, { method: "GET" }),
    getSavedCanvas: <T>(workspaceId: string, snapshotId: string, savedCanvasId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}`, { method: "GET" }),
    createSavedCanvas: <T>(workspaceId: string, snapshotId: string, payload: SavedCanvasUpsertRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateSavedCanvas: <T>(workspaceId: string, snapshotId: string, savedCanvasId: string, payload: SavedCanvasUpsertRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    duplicateSavedCanvas: <T>(workspaceId: string, snapshotId: string, savedCanvasId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}/duplicate`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    deleteSavedCanvas: (workspaceId: string, snapshotId: string, savedCanvasId: string) =>
      client.fetchNoContent(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-canvases/${savedCanvasId}`, {
        method: "DELETE",
      }),
    createSavedView: <T>(workspaceId: string, snapshotId: string, payload: SavedViewCreateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-views`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    duplicateSavedView: <T>(workspaceId: string, snapshotId: string, savedViewId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-views/${savedViewId}/duplicate`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    deleteSavedView: (workspaceId: string, snapshotId: string, savedViewId: string) =>
      client.fetchNoContent(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/saved-views/${savedViewId}`, {
        method: "DELETE",
      }),
  };
}

export const platformApi = createPlatformApi();
