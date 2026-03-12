import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toDependencyEntityOptions } from "../dependencyViewModel";
import { toEntryPointItemOptions } from "../entryPointViewModel";
import { toSearchResultOptions } from "../searchViewModel";
import { platformApi } from "../platformApi";
import {
  containsScope,
  DependencyDirection,
  DependencyView,
  EntityDetail,
  EntryCategory,
  EntryPointView,
  flattenLayout,
  LayoutScopeDetail,
  LayoutTree,
  SearchView,
  SnapshotOverview,
  SnapshotSummary,
} from "../appModel";

type BrowserExplorerFeedback = {
  setError: (value: string | null) => void;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

export type UseBrowserExplorerArgs = {
  selectedWorkspaceId: string | null;
  snapshots: SnapshotSummary[];
  selectedSnapshotId: string | null;
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>;
  feedback: BrowserExplorerFeedback;
};

export function useBrowserExplorer({
  selectedWorkspaceId,
  snapshots,
  selectedSnapshotId,
  setSelectedSnapshotId,
  feedback,
}: UseBrowserExplorerArgs) {
  const { setError } = feedback;
  const [snapshotOverview, setSnapshotOverview] = useState<SnapshotOverview | null>(null);
  const [layoutTree, setLayoutTree] = useState<LayoutTree | null>(null);
  const [selectedLayoutScopeId, setSelectedLayoutScopeId] = useState<string | null>(null);
  const [layoutScopeDetail, setLayoutScopeDetail] = useState<LayoutScopeDetail | null>(null);
  const [dependencyView, setDependencyView] = useState<DependencyView | null>(null);
  const [selectedDependencyScopeId, setSelectedDependencyScopeId] = useState<string>("");
  const [dependencyDirection, setDependencyDirection] = useState<DependencyDirection>("ALL");
  const [focusedDependencyEntityId, setFocusedDependencyEntityId] = useState<string>("");
  const [entryPointView, setEntryPointView] = useState<EntryPointView | null>(null);
  const [selectedEntryPointScopeId, setSelectedEntryPointScopeId] = useState<string>("");
  const [entryCategory, setEntryCategory] = useState<EntryCategory>("ALL");
  const [focusedEntryPointId, setFocusedEntryPointId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSearchScopeId, setSelectedSearchScopeId] = useState<string>("");
  const [searchView, setSearchView] = useState<SearchView | null>(null);
  const [selectedSearchEntityId, setSelectedSearchEntityId] = useState<string>("");
  const [entityDetail, setEntityDetail] = useState<EntityDetail | null>(null);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const flattenedLayoutNodes = useMemo(() => flattenLayout(layoutTree?.roots ?? []), [layoutTree]);
  const dependencyEntityOptions = useMemo(() => toDependencyEntityOptions(dependencyView?.entities ?? []), [dependencyView]);
  const entryPointOptions = useMemo(() => toEntryPointItemOptions(entryPointView?.items ?? []), [entryPointView]);
  const searchResultOptions = useMemo(() => toSearchResultOptions(searchView?.results ?? []), [searchView]);

  useEffect(() => {
    setSelectedSnapshotId((current) => (current && snapshots.some((snapshot) => snapshot.id === current) ? current : (snapshots[0]?.id ?? null)));
  }, [snapshots, setSelectedSnapshotId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadSnapshotOverview(selectedWorkspaceId, selectedSnapshotId);
      void loadLayoutTree(selectedWorkspaceId, selectedSnapshotId);
      return;
    }

    setSnapshotOverview(null);
    setLayoutTree(null);
    setSelectedLayoutScopeId(null);
    setLayoutScopeDetail(null);
    setDependencyView(null);
    setSelectedDependencyScopeId("");
    setDependencyDirection("ALL");
    setFocusedDependencyEntityId("");
    setEntryPointView(null);
    setSelectedEntryPointScopeId("");
    setEntryCategory("ALL");
    setFocusedEntryPointId("");
    setSearchQuery("");
    setSelectedSearchScopeId("");
    setSearchView(null);
    setSelectedSearchEntityId("");
    setEntityDetail(null);
  }, [selectedWorkspaceId, selectedSnapshotId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && selectedLayoutScopeId) {
      void loadLayoutScopeDetail(selectedWorkspaceId, selectedSnapshotId, selectedLayoutScopeId);
      return;
    }
    setLayoutScopeDetail(null);
  }, [selectedWorkspaceId, selectedSnapshotId, selectedLayoutScopeId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadDependencyView(selectedWorkspaceId, selectedSnapshotId, selectedDependencyScopeId || undefined, dependencyDirection, focusedDependencyEntityId || undefined);
      return;
    }
    setDependencyView(null);
  }, [selectedWorkspaceId, selectedSnapshotId, selectedDependencyScopeId, dependencyDirection, focusedDependencyEntityId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadEntryPointView(selectedWorkspaceId, selectedSnapshotId, selectedEntryPointScopeId || undefined, entryCategory, focusedEntryPointId || undefined);
      return;
    }
    setEntryPointView(null);
  }, [selectedWorkspaceId, selectedSnapshotId, selectedEntryPointScopeId, entryCategory, focusedEntryPointId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadSearchView(selectedWorkspaceId, selectedSnapshotId, searchQuery, selectedSearchScopeId || undefined);
      return;
    }
    setSearchView(null);
  }, [selectedWorkspaceId, selectedSnapshotId, searchQuery, selectedSearchScopeId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && selectedSearchEntityId) {
      void loadEntityDetail(selectedWorkspaceId, selectedSnapshotId, selectedSearchEntityId);
      return;
    }
    setEntityDetail(null);
  }, [selectedWorkspaceId, selectedSnapshotId, selectedSearchEntityId]);

  async function loadSnapshotOverview(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getSnapshotOverview<SnapshotOverview>(workspaceId, snapshotId);
      setSnapshotOverview(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadLayoutTree(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getLayoutTree<LayoutTree>(workspaceId, snapshotId);
      setLayoutTree(payload);
      const firstScope = payload.roots[0]?.externalId ?? null;
      setSelectedLayoutScopeId((current) => (current && containsScope(payload.roots, current) ? current : firstScope));
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadLayoutScopeDetail(workspaceId: string, snapshotId: string, scopeId: string) {
    try {
      const payload = await platformApi.getLayoutScopeDetail<LayoutScopeDetail>(workspaceId, snapshotId, scopeId);
      setLayoutScopeDetail(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadDependencyView(workspaceId: string, snapshotId: string, scopeId?: string, direction: DependencyDirection = "ALL", focusEntityId?: string) {
    try {
      const payload = await platformApi.getDependencyView<DependencyView>(workspaceId, snapshotId, direction, scopeId, focusEntityId);
      setDependencyView(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadEntryPointView(workspaceId: string, snapshotId: string, scopeId?: string, category: EntryCategory = "ALL", focusEntityId?: string) {
    try {
      const payload = await platformApi.getEntryPointView<EntryPointView>(workspaceId, snapshotId, category, scopeId, focusEntityId);
      setEntryPointView(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadSearchView(workspaceId: string, snapshotId: string, queryText: string, scopeId?: string) {
    try {
      const payload = await platformApi.searchSnapshot<SearchView>(workspaceId, snapshotId, queryText, scopeId, 25);
      setSearchView(payload);
      setSelectedSearchEntityId((current) => (current && payload.results.some((result) => result.externalId === current) ? current : ""));
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadEntityDetail(workspaceId: string, snapshotId: string, entityId: string) {
    try {
      const payload = await platformApi.getEntityDetail<EntityDetail>(workspaceId, snapshotId, entityId);
      setEntityDetail(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  return {
    selectedSnapshotId,
    setSelectedSnapshotId,
    selectedSnapshot,
    snapshotOverview,
    flattenedLayoutNodes,
    selectedLayoutScopeId,
    setSelectedLayoutScopeId,
    layoutTree,
    layoutScopeDetail,
    selectedDependencyScopeId,
    setSelectedDependencyScopeId,
    dependencyDirection,
    setDependencyDirection,
    dependencyView,
    dependencyEntityOptions,
    focusedDependencyEntityId,
    setFocusedDependencyEntityId,
    selectedEntryPointScopeId,
    setSelectedEntryPointScopeId,
    entryCategory,
    setEntryCategory,
    entryPointView,
    entryPointOptions,
    focusedEntryPointId,
    setFocusedEntryPointId,
    selectedSearchScopeId,
    setSelectedSearchScopeId,
    searchQuery,
    setSearchQuery,
    searchView,
    searchResultOptions,
    selectedSearchEntityId,
    setSelectedSearchEntityId,
    entityDetail,
  };
}
