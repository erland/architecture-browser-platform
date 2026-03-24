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

export type OverlayCreateRequest = {
  name: string;
  kind: string;
  targetEntityIds: string[];
  targetScopeIds: string[];
  note: string;
  attributes: Record<string, unknown>;
};

export type SavedViewCreateRequest = {
  name: string;
  viewType: string;
  queryState: Record<string, string>;
  layoutState: Record<string, string>;
};

function withQuery(path: string, params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}` !== "") {
      search.set(key, `${value}`);
    }
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function createPlatformApi(client = httpClient) {
  return {
    getHealth: <T>() => client.fetchJson<T>("/api/health", { method: "GET" }),
    listWorkspaces: <T>() => client.fetchJson<T>("/api/workspaces", { method: "GET" }),
    getWorkspaceRepositories: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/repositories`, { method: "GET" }),
    getWorkspaceRuns: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/runs/recent`, { method: "GET" }),
    getWorkspaceSnapshots: <T>(workspaceId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots`, { method: "GET" }),
    getSnapshotOverview: <T>(workspaceId: string, snapshotId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/overview`, { method: "GET" }),
    getFullSnapshotPayload: <T>(workspaceId: string, snapshotId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/full`, { method: "GET" }),
    getLayoutTree: <T>(workspaceId: string, snapshotId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/layout/tree`, { method: "GET" }),
    getLayoutScopeDetail: <T>(workspaceId: string, snapshotId: string, scopeId: string) => client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/layout/scopes/${encodeURIComponent(scopeId)}`, { method: "GET" }),
    getDependencyView: <T>(workspaceId: string, snapshotId: string, direction: string, scopeId?: string, focusEntityId?: string) =>
      client.fetchJson<T>(
        withQuery(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/dependencies`, {
          scopeId,
          focusEntityId,
          direction,
        }),
        { method: "GET" },
      ),
    getEntryPointView: <T>(workspaceId: string, snapshotId: string, category: string, scopeId?: string, focusEntityId?: string) =>
      client.fetchJson<T>(
        withQuery(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/entry-points`, {
          scopeId,
          focusEntityId,
          category,
        }),
        { method: "GET" },
      ),
    searchSnapshot: <T>(workspaceId: string, snapshotId: string, queryText: string, scopeId?: string, limit = 25) =>
      client.fetchJson<T>(
        withQuery(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/search`, {
          q: queryText.trim() || undefined,
          scopeId,
          limit,
        }),
        { method: "GET" },
      ),
    getEntityDetail: <T>(workspaceId: string, snapshotId: string, entityId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/entities/${encodeURIComponent(entityId)}`, { method: "GET" }),
    getCustomizationOverview: <T>(workspaceId: string, snapshotId: string) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/customizations`, { method: "GET" }),
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
    createOverlay: <T>(workspaceId: string, snapshotId: string, payload: OverlayCreateRequest) =>
      client.fetchJson<T>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/overlays`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    deleteOverlay: (workspaceId: string, snapshotId: string, overlayId: string) =>
      client.fetchNoContent(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/overlays/${overlayId}`, {
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
