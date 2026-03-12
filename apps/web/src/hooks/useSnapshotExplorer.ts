import { FormEvent, useEffect, useMemo, useState } from "react";
import { toDependencyEntityOptions } from "../dependencyViewModel";
import { toEntryPointItemOptions } from "../entryPointViewModel";
import { toSearchResultOptions } from "../searchViewModel";
import { buildSavedViewRequest, parseSavedViewJson } from "../savedViewModel";
import { comparisonSnapshotOptions } from "../compareViewModel";
import { platformApi } from "../platformApi";
import {
  containsScope,
  CustomizationOverview,
  DependencyDirection,
  DependencyView,
  EntityDetail,
  EntryCategory,
  EntryPointView,
  flattenLayout,
  LayoutScopeDetail,
  LayoutTree,
  OverlayKind,
  OverlayRecord,
  SavedViewRecord,
  SearchView,
  SnapshotComparison,
  SnapshotOverview,
  SnapshotSummary,
} from "../appModel";

type FeedbackSetters = {
  setBusyMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

export function useSnapshotExplorer(
  selectedWorkspaceId: string | null,
  snapshots: SnapshotSummary[],
  { setBusyMessage, setError }: FeedbackSetters,
) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
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
  const [customizationOverview, setCustomizationOverview] = useState<CustomizationOverview | null>(null);
  const [overlayName, setOverlayName] = useState<string>("");
  const [overlayKind, setOverlayKind] = useState<OverlayKind>("ANNOTATION");
  const [overlayNote, setOverlayNote] = useState<string>("");
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>("");
  const [savedViewName, setSavedViewName] = useState<string>("");
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>("");
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string>("");
  const [snapshotComparison, setSnapshotComparison] = useState<SnapshotComparison | null>(null);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const flattenedLayoutNodes = useMemo(() => flattenLayout(layoutTree?.roots ?? []), [layoutTree]);
  const dependencyEntityOptions = useMemo(() => toDependencyEntityOptions(dependencyView?.entities ?? []), [dependencyView]);
  const entryPointOptions = useMemo(() => toEntryPointItemOptions(entryPointView?.items ?? []), [entryPointView]);
  const searchResultOptions = useMemo(() => toSearchResultOptions(searchView?.results ?? []), [searchView]);
  const comparisonOptions = useMemo(() => comparisonSnapshotOptions(snapshots, selectedSnapshotId), [snapshots, selectedSnapshotId]);

  useEffect(() => {
    setSelectedSnapshotId((current) => (current && snapshots.some((snapshot) => snapshot.id === current) ? current : (snapshots[0]?.id ?? null)));
  }, [snapshots]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadSnapshotOverview(selectedWorkspaceId, selectedSnapshotId);
      void loadLayoutTree(selectedWorkspaceId, selectedSnapshotId);
      void loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      return;
    }

    setSnapshotOverview(null);
    setLayoutTree(null);
    setSelectedLayoutScopeId(null);
    setLayoutScopeDetail(null);
    setDependencyView(null);
    setSelectedDependencyScopeId("");
    setFocusedDependencyEntityId("");
    setEntryPointView(null);
    setSelectedEntryPointScopeId("");
    setFocusedEntryPointId("");
    setSearchQuery("");
    setSelectedSearchScopeId("");
    setSearchView(null);
    setSelectedSearchEntityId("");
    setEntityDetail(null);
    setCustomizationOverview(null);
    setOverlayName("");
    setOverlayKind("ANNOTATION");
    setOverlayNote("");
    setSelectedOverlayId("");
    setSavedViewName("");
    setSelectedSavedViewId("");
    setComparisonSnapshotId("");
    setSnapshotComparison(null);
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

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && comparisonSnapshotId) {
      void loadSnapshotComparison(selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId);
      return;
    }
    setSnapshotComparison(null);
  }, [selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId]);

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

  async function loadCustomizationOverview(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getCustomizationOverview<CustomizationOverview>(workspaceId, snapshotId);
      setCustomizationOverview(payload);
      setSelectedOverlayId((current) => (current && payload.overlays.some((item) => item.id === current) ? current : ""));
      setSelectedSavedViewId((current) => (current && payload.savedViews.some((item) => item.id === current) ? current : ""));
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadSnapshotComparison(workspaceId: string, snapshotId: string, otherSnapshotId: string) {
    try {
      const payload = await platformApi.getSnapshotComparison<SnapshotComparison>(workspaceId, snapshotId, otherSnapshotId);
      setSnapshotComparison(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function handleCreateOverlay(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Creating overlay…");
    try {
      const targetEntityIds = selectedSearchEntityId ? [selectedSearchEntityId] : [];
      const targetScopeIds = selectedSearchScopeId ? [selectedSearchScopeId] : (selectedLayoutScopeId ? [selectedLayoutScopeId] : []);
      await platformApi.createOverlay<OverlayRecord>(selectedWorkspaceId, selectedSnapshotId, {
        name: overlayName,
        kind: overlayKind,
        targetEntityIds,
        targetScopeIds,
        note: overlayNote,
        attributes: {},
      });
      setOverlayName("");
      setOverlayNote("");
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteOverlay(overlayId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Deleting overlay…");
    try {
      await platformApi.deleteOverlay(selectedWorkspaceId, selectedSnapshotId, overlayId);
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleSaveCurrentView(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Saving view…");
    try {
      await platformApi.createSavedView<SavedViewRecord>(
        selectedWorkspaceId,
        selectedSnapshotId,
        buildSavedViewRequest(savedViewName, {
          selectedSearchScopeId,
          searchQuery,
          selectedSearchEntityId,
          selectedLayoutScopeId: selectedLayoutScopeId ?? "",
          selectedDependencyScopeId,
          dependencyDirection,
          focusedDependencyEntityId,
          selectedEntryPointScopeId,
          entryCategory,
          focusedEntryPointId,
        }),
      );
      setSavedViewName("");
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleApplySavedView(savedViewId: string) {
    const savedView = customizationOverview?.savedViews.find((item) => item.id === savedViewId);
    if (!savedView) return;
    const queryState = parseSavedViewJson<Record<string, string>>(savedView.queryJson) ?? {};
    const layoutState = parseSavedViewJson<Record<string, string>>(savedView.layoutJson) ?? {};
    setSelectedSearchScopeId(queryState.selectedSearchScopeId ?? "");
    setSearchQuery(queryState.searchQuery ?? "");
    setSelectedSearchEntityId(queryState.selectedSearchEntityId ?? "");
    setSelectedEntryPointScopeId(queryState.selectedEntryPointScopeId ?? "");
    setEntryCategory((queryState.entryCategory as EntryCategory | undefined) ?? "ALL");
    setFocusedEntryPointId(queryState.focusedEntryPointId ?? "");
    setSelectedLayoutScopeId(layoutState.selectedLayoutScopeId || null);
    setSelectedDependencyScopeId(layoutState.selectedDependencyScopeId ?? "");
    setDependencyDirection((layoutState.dependencyDirection as DependencyDirection | undefined) ?? "ALL");
    setFocusedDependencyEntityId(layoutState.focusedDependencyEntityId ?? "");
    setSelectedSavedViewId(savedViewId);
  }

  async function handleDuplicateSavedView(savedViewId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Duplicating saved view…");
    try {
      await platformApi.duplicateSavedView<SavedViewRecord>(selectedWorkspaceId, selectedSnapshotId, savedViewId);
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteSavedView(savedViewId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Deleting saved view…");
    try {
      await platformApi.deleteSavedView(selectedWorkspaceId, selectedSnapshotId, savedViewId);
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
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
    customizationOverview,
    overlayName,
    setOverlayName,
    overlayKind,
    setOverlayKind,
    overlayNote,
    setOverlayNote,
    handleCreateOverlay,
    selectedOverlayId,
    setSelectedOverlayId,
    handleDeleteOverlay,
    savedViewName,
    setSavedViewName,
    handleSaveCurrentView,
    selectedSavedViewId,
    handleApplySavedView,
    handleDuplicateSavedView,
    handleDeleteSavedView,
    comparisonSnapshotId,
    setComparisonSnapshotId,
    comparisonOptions,
    snapshotComparison,
  };
}
