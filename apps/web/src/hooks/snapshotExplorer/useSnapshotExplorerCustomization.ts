import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { buildSavedViewRequest, parseSavedViewJson } from '../../savedViewModel';
import { platformApi } from '../../platformApi';
import type {
  CustomizationOverview,
  DependencyDirection,
  EntryCategory,
  OverlayKind,
  OverlayRecord,
  SavedViewRecord,
} from '../../appModel';
import type { FeedbackSetters } from './useSnapshotExplorer.types';

type CustomizationBindingArgs = {
  selectedWorkspaceId: string | null;
  selectedSnapshotId: string | null;
  setSelectedSearchScopeId: Dispatch<SetStateAction<string>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedSearchEntityId: Dispatch<SetStateAction<string>>;
  setSelectedEntryPointScopeId: Dispatch<SetStateAction<string>>;
  setEntryCategory: Dispatch<SetStateAction<EntryCategory>>;
  setFocusedEntryPointId: Dispatch<SetStateAction<string>>;
  setSelectedLayoutScopeId: Dispatch<SetStateAction<string | null>>;
  setSelectedDependencyScopeId: Dispatch<SetStateAction<string>>;
  setDependencyDirection: Dispatch<SetStateAction<DependencyDirection>>;
  setFocusedDependencyEntityId: Dispatch<SetStateAction<string>>;
  selectedSearchScopeId: string;
  searchQuery: string;
  selectedSearchEntityId: string;
  selectedLayoutScopeId: string | null;
  selectedDependencyScopeId: string;
  dependencyDirection: DependencyDirection;
  focusedDependencyEntityId: string;
  selectedEntryPointScopeId: string;
  entryCategory: EntryCategory;
  focusedEntryPointId: string;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

export function useSnapshotExplorerCustomization(
  args: CustomizationBindingArgs,
  feedback: FeedbackSetters,
) {
  const {
    selectedWorkspaceId,
    selectedSnapshotId,
    setSelectedSearchScopeId,
    setSearchQuery,
    setSelectedSearchEntityId,
    setSelectedEntryPointScopeId,
    setEntryCategory,
    setFocusedEntryPointId,
    setSelectedLayoutScopeId,
    setSelectedDependencyScopeId,
    setDependencyDirection,
    setFocusedDependencyEntityId,
    selectedSearchScopeId,
    searchQuery,
    selectedSearchEntityId,
    selectedLayoutScopeId,
    selectedDependencyScopeId,
    dependencyDirection,
    focusedDependencyEntityId,
    selectedEntryPointScopeId,
    entryCategory,
    focusedEntryPointId,
  } = args;
  const { setBusyMessage, setError } = feedback;

  const [customizationOverview, setCustomizationOverview] = useState<CustomizationOverview | null>(null);
  const [overlayName, setOverlayName] = useState<string>('');
  const [overlayKind, setOverlayKind] = useState<OverlayKind>('ANNOTATION');
  const [overlayNote, setOverlayNote] = useState<string>('');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>('');
  const [savedViewName, setSavedViewName] = useState<string>('');
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>('');

  async function loadCustomizationOverview(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getCustomizationOverview<CustomizationOverview>(workspaceId, snapshotId);
      setCustomizationOverview(payload);
      setSelectedOverlayId((current) => (current && payload.overlays.some((item) => item.id === current) ? current : ''));
      setSelectedSavedViewId((current) => (current && payload.savedViews.some((item) => item.id === current) ? current : ''));
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      return;
    }

    setCustomizationOverview(null);
    setOverlayName('');
    setOverlayKind('ANNOTATION');
    setOverlayNote('');
    setSelectedOverlayId('');
    setSavedViewName('');
    setSelectedSavedViewId('');
  }, [selectedWorkspaceId, selectedSnapshotId]);

  async function handleCreateOverlay(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage('Creating overlay…');
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
      setOverlayName('');
      setOverlayNote('');
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
    setBusyMessage('Deleting overlay…');
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
    setBusyMessage('Saving view…');
    try {
      await platformApi.createSavedView<SavedViewRecord>(
        selectedWorkspaceId,
        selectedSnapshotId,
        buildSavedViewRequest(savedViewName, {
          selectedSearchScopeId,
          searchQuery,
          selectedSearchEntityId,
          selectedLayoutScopeId: selectedLayoutScopeId ?? '',
          selectedDependencyScopeId,
          dependencyDirection,
          focusedDependencyEntityId,
          selectedEntryPointScopeId,
          entryCategory,
          focusedEntryPointId,
        }),
      );
      setSavedViewName('');
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
    setSelectedSearchScopeId(queryState.selectedSearchScopeId ?? '');
    setSearchQuery(queryState.searchQuery ?? '');
    setSelectedSearchEntityId(queryState.selectedSearchEntityId ?? '');
    setSelectedEntryPointScopeId(queryState.selectedEntryPointScopeId ?? '');
    setEntryCategory((queryState.entryCategory as EntryCategory | undefined) ?? 'ALL');
    setFocusedEntryPointId(queryState.focusedEntryPointId ?? '');
    setSelectedLayoutScopeId(layoutState.selectedLayoutScopeId || null);
    setSelectedDependencyScopeId(layoutState.selectedDependencyScopeId ?? '');
    setDependencyDirection((layoutState.dependencyDirection as DependencyDirection | undefined) ?? 'ALL');
    setFocusedDependencyEntityId(layoutState.focusedDependencyEntityId ?? '');
    setSelectedSavedViewId(savedViewId);
  }

  async function handleDuplicateSavedView(savedViewId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage('Duplicating saved view…');
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
    setBusyMessage('Deleting saved view…');
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
    customizationOverview,
    loadCustomizationOverview,
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
    setSelectedSavedViewId,
    handleApplySavedView,
    handleDuplicateSavedView,
    handleDeleteSavedView,
  };
}
