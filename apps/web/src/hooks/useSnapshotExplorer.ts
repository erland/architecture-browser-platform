import { FormEvent, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { buildSavedViewRequest, parseSavedViewJson } from "../savedViewModel";
import { comparisonSnapshotOptions } from "../compareViewModel";
import { useBrowserExplorer } from "./useBrowserExplorer";
import { platformApi } from "../platformApi";
import {
  CustomizationOverview,
  DependencyDirection,
  EntryCategory,
  OverlayKind,
  OverlayRecord,
  SavedViewRecord,
  SnapshotComparison,
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
  selectedSnapshotId: string | null,
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>,
  { setBusyMessage, setError }: FeedbackSetters,
) {
  const browserExplorer = useBrowserExplorer({
    selectedWorkspaceId,
    snapshots,
    selectedSnapshotId,
    setSelectedSnapshotId,
    feedback: { setError },
  });

  const {
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
  } = browserExplorer;

  const [customizationOverview, setCustomizationOverview] = useState<CustomizationOverview | null>(null);
  const [overlayName, setOverlayName] = useState<string>("");
  const [overlayKind, setOverlayKind] = useState<OverlayKind>("ANNOTATION");
  const [overlayNote, setOverlayNote] = useState<string>("");
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>("");
  const [savedViewName, setSavedViewName] = useState<string>("");
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>("");
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string>("");
  const [snapshotComparison, setSnapshotComparison] = useState<SnapshotComparison | null>(null);

  const comparisonOptions = useMemo(() => comparisonSnapshotOptions(snapshots, selectedSnapshotId), [snapshots, selectedSnapshotId]);



  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      return;
    }

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
    if (selectedWorkspaceId && selectedSnapshotId && comparisonSnapshotId) {
      void loadSnapshotComparison(selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId);
      return;
    }
    setSnapshotComparison(null);
  }, [selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId]);


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
