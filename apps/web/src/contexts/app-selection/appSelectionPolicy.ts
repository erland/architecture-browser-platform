import {
  emptyAppSelectionState,
  mergeAppSelectionState,
  parseAppSelectionSearch,
  type AppSelectionState,
} from '../../routing/appSelectionState';

export const APP_SELECTION_STORAGE_KEY = 'architecture-browser-platform.app-selection.v1';
export const LAST_OPEN_BROWSER_SOURCE_STORAGE_KEY = 'architecture-browser-platform.browser-last-open-source-tree.v1';

export type BrowserActiveSnapshot = {
  workspaceId: string;
  repositoryId: string | null;
  snapshotId: string;
};

export function resolveInitialSelection(args: {
  persistedSelection?: Partial<AppSelectionState> | null;
  lastOpenedBrowserSource?: Partial<AppSelectionState> | null;
  locationSearch?: string;
}): AppSelectionState {
  return mergeAppSelectionState(
    args.persistedSelection,
    mergeAppSelectionState(
      args.lastOpenedBrowserSource,
      parseAppSelectionSearch(args.locationSearch ?? ''),
    ),
  );
}

export function buildLastOpenedBrowserSourceSelection(activeSnapshot: BrowserActiveSnapshot): AppSelectionState {
  return {
    selectedWorkspaceId: activeSnapshot.workspaceId,
    selectedRepositoryId: activeSnapshot.repositoryId,
    selectedSnapshotId: activeSnapshot.snapshotId,
  };
}

export function applyWorkspaceSelection(
  current: AppSelectionState,
  nextValue: string | null | ((currentValue: string | null) => string | null),
): AppSelectionState {
  const resolvedWorkspaceId = typeof nextValue === 'function' ? nextValue(current.selectedWorkspaceId) : nextValue;
  if (resolvedWorkspaceId === current.selectedWorkspaceId) {
    return current;
  }
  return {
    selectedWorkspaceId: resolvedWorkspaceId,
    selectedRepositoryId: null,
    selectedSnapshotId: null,
  };
}

export function applyRepositorySelection(
  current: AppSelectionState,
  nextValue: string | null | ((currentValue: string | null) => string | null),
): AppSelectionState {
  const resolvedRepositoryId = typeof nextValue === 'function' ? nextValue(current.selectedRepositoryId) : nextValue;
  if (resolvedRepositoryId === current.selectedRepositoryId) {
    return current;
  }
  return {
    ...current,
    selectedRepositoryId: resolvedRepositoryId,
    selectedSnapshotId: null,
  };
}

export function applySnapshotSelection(
  current: AppSelectionState,
  nextValue: string | null | ((currentValue: string | null) => string | null),
): AppSelectionState {
  const resolvedSnapshotId = typeof nextValue === 'function' ? nextValue(current.selectedSnapshotId) : nextValue;
  if (resolvedSnapshotId === current.selectedSnapshotId) {
    return current;
  }
  return {
    ...current,
    selectedSnapshotId: resolvedSnapshotId,
  };
}

export function mergeSelectionWithLocationSearch(current: AppSelectionState, locationSearch: string): AppSelectionState {
  return mergeAppSelectionState(current, parseAppSelectionSearch(locationSearch));
}

export function emptySelection(): AppSelectionState {
  return emptyAppSelectionState;
}
