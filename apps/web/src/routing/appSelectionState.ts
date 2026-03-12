export type AppSelectionState = {
  selectedWorkspaceId: string | null;
  selectedRepositoryId: string | null;
  selectedSnapshotId: string | null;
};

export const emptyAppSelectionState: AppSelectionState = {
  selectedWorkspaceId: null,
  selectedRepositoryId: null,
  selectedSnapshotId: null,
};

function normalizeId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function parseAppSelectionSearch(search: string): Partial<AppSelectionState> {
  const params = new URLSearchParams(search);
  return {
    selectedWorkspaceId: normalizeId(params.get('workspace')),
    selectedRepositoryId: normalizeId(params.get('repository')),
    selectedSnapshotId: normalizeId(params.get('snapshot')),
  };
}

export function mergeAppSelectionState(
  persisted: Partial<AppSelectionState> | null | undefined,
  urlState: Partial<AppSelectionState> | null | undefined,
): AppSelectionState {
  return {
    selectedWorkspaceId: normalizeId(urlState?.selectedWorkspaceId) ?? normalizeId(persisted?.selectedWorkspaceId) ?? null,
    selectedRepositoryId: normalizeId(urlState?.selectedRepositoryId) ?? normalizeId(persisted?.selectedRepositoryId) ?? null,
    selectedSnapshotId: normalizeId(urlState?.selectedSnapshotId) ?? normalizeId(persisted?.selectedSnapshotId) ?? null,
  };
}

export function buildAppSelectionSearch(search: string, state: AppSelectionState): string {
  const params = new URLSearchParams(search);

  setOrDelete(params, 'workspace', state.selectedWorkspaceId);
  setOrDelete(params, 'repository', state.selectedRepositoryId);
  setOrDelete(params, 'snapshot', state.selectedSnapshotId);

  const rendered = params.toString();
  return rendered.length ? `?${rendered}` : '';
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value) {
    params.set(key, value);
    return;
  }
  params.delete(key);
}
