export type SavedViewState = {
  selectedSearchScopeId?: string;
  searchQuery?: string;
  selectedSearchEntityId?: string;
  selectedLayoutScopeId?: string;
  selectedDependencyScopeId?: string;
  dependencyDirection?: string;
  focusedDependencyEntityId?: string;
  selectedEntryPointScopeId?: string;
  entryCategory?: string;
  focusedEntryPointId?: string;
};

export function parseSavedViewJson<T>(json: string | null): T | null {
  if (!json || !json.trim()) {
    return null;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function toSavedViewStateLabel(name: string, viewType: string, snapshotKey: string | null) {
  return [name, viewType, snapshotKey].filter(Boolean).join(" · ");
}

export function buildSavedViewRequest(name: string, state: SavedViewState) {
  return {
    name: name.trim(),
    viewType: "SNAPSHOT_BROWSER",
    queryState: {
      selectedSearchScopeId: state.selectedSearchScopeId ?? "",
      searchQuery: state.searchQuery ?? "",
      selectedSearchEntityId: state.selectedSearchEntityId ?? "",
      selectedEntryPointScopeId: state.selectedEntryPointScopeId ?? "",
      entryCategory: state.entryCategory ?? "ALL",
      focusedEntryPointId: state.focusedEntryPointId ?? "",
    },
    layoutState: {
      selectedLayoutScopeId: state.selectedLayoutScopeId ?? "",
      selectedDependencyScopeId: state.selectedDependencyScopeId ?? "",
      dependencyDirection: state.dependencyDirection ?? "ALL",
      focusedDependencyEntityId: state.focusedDependencyEntityId ?? "",
    },
  };
}
