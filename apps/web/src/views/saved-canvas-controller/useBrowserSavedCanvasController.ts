/**
 * Composes saved-canvas controller concerns from smaller hooks: shared state,
 * record/sync orchestration, and action-driven open/save/rebinding flows.
 */
import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';
import type { AppSelectionState } from '../../routing/appSelectionState';
import type { SnapshotSummary } from '../../app-model';
import type { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useSavedCanvasControllerState } from './useSavedCanvasControllerState';
import { useLoadSavedCanvasRecordsOnMount, useSavedCanvasRecords, useSavedCanvasSyncActions } from './useSavedCanvasRecordsAndSync';
import { useSavedCanvasOpenAndManage } from './useSavedCanvasOpenAndManage';

export type BrowserSavedCanvasController = ReturnType<typeof useBrowserSavedCanvasController>;

type UseBrowserSavedCanvasControllerArgs = {
  browserSession: BrowserSessionContextValue;
  selection: AppSelectionState & {
    setSelectedWorkspaceId: (value: string | null) => void;
    setSelectedRepositoryId: (value: string | null) => void;
    setSelectedSnapshotId: (value: string | null) => void;
  };
  workspaceData: ReturnType<typeof useWorkspaceData>;
  selectedSnapshot: SnapshotSummary | null;
  selectedRepositoryId: string | null;
  selectedSnapshotLabel: string;
};

export function useBrowserSavedCanvasController({
  browserSession,
  selection,
  workspaceData,
  selectedSnapshot,
  selectedRepositoryId,
  selectedSnapshotLabel,
}: UseBrowserSavedCanvasControllerArgs) {
  const selectedWorkspaceId = workspaceData.selectedWorkspaceId ?? selection.selectedWorkspaceId ?? null;
  const effectiveRepositoryId = selectedRepositoryId ?? selection.selectedRepositoryId ?? null;

  const { state, services } = useSavedCanvasControllerState({
    browserSession,
    selectedSnapshot,
    selectedSnapshotLabel,
  });

  const loadSavedCanvasRecords = useSavedCanvasRecords({
    savedCanvasStore: services.savedCanvasStore,
    selectedWorkspaceId,
    selectedRepositoryId: effectiveRepositoryId,
    setSavedCanvasRecords: state.setSavedCanvasRecords,
  });

  const syncActions = useSavedCanvasSyncActions({
    selectedWorkspaceId,
    selectedRepositoryId: effectiveRepositoryId,
    savedCanvasSyncService: services.savedCanvasSyncService,
    loadSavedCanvasRecords,
    currentSavedCanvasId: state.currentSavedCanvasId,
    setCurrentSavedCanvasId: state.setCurrentSavedCanvasId,
    setSavedCanvasStatusMessage: state.setSavedCanvasStatusMessage,
    setIsSavedCanvasBusy: state.setIsSavedCanvasBusy,
  });

  useLoadSavedCanvasRecordsOnMount({ loadSavedCanvasRecords });

  const openAndManage = useSavedCanvasOpenAndManage({
    browserSession,
    selection,
    selectedSnapshot,
    selectedSnapshotLabel,
    currentSavedCanvasId: state.currentSavedCanvasId,
    currentSavedCanvasBaseline: state.currentSavedCanvasBaseline,
    savedCanvasDraftName: state.savedCanvasDraftName,
    savedCanvasAvailabilityById: state.savedCanvasAvailabilityById,
    isOffline: state.isOffline,
    rebindingCanvasId: state.rebindingCanvasId,
    setIsSavedCanvasBusy: state.setIsSavedCanvasBusy,
    setSavedCanvasStatusMessage: state.setSavedCanvasStatusMessage,
    setCurrentSavedCanvasId: state.setCurrentSavedCanvasId,
    setCurrentSavedCanvasBaseline: state.setCurrentSavedCanvasBaseline,
    setSavedCanvasDraftName: state.setSavedCanvasDraftName,
    setRebindingCanvasId: state.setRebindingCanvasId,
    setRebindingSummary: state.setRebindingSummary,
    setIsSavedCanvasDialogOpen: state.setIsSavedCanvasDialogOpen,
    savedCanvasStore: services.savedCanvasStore,
    savedCanvasSyncService: services.savedCanvasSyncService,
    runSavedCanvasSync: syncActions.runSavedCanvasSync,
    applySavedCanvasSyncResult: syncActions.applySavedCanvasSyncResult,
    loadSavedCanvasRecords,
    buildOfflineUnavailableMessage: services.buildOfflineUnavailableMessage,
  });

  return {
    isSavedCanvasDialogOpen: state.isSavedCanvasDialogOpen,
    setIsSavedCanvasDialogOpen: state.setIsSavedCanvasDialogOpen,
    draftName: state.savedCanvasDraftName,
    setDraftName: state.setSavedCanvasDraftName,
    statusMessage: state.savedCanvasStatusMessage,
    isBusy: state.isSavedCanvasBusy,
    records: state.savedCanvasRecords,
    currentCanvasId: state.currentSavedCanvasId,
    pendingSyncCount: state.pendingSavedCanvasSyncCount,
    currentCanvasHasLocalEdits: state.currentSavedCanvasHasLocalEdits,
    rebindingCanvasId: state.rebindingCanvasId,
    rebindingSummary: state.rebindingSummary,
    isOffline: state.isOffline,
    availabilityByCanvasId: state.savedCanvasAvailabilityById,
    handleOpenDialog: openAndManage.handleOpenSavedCanvasDialog,
    handleSaveCurrentCanvas: openAndManage.handleSaveCurrentCanvas,
    handleOpenCanvas: openAndManage.handleOpenSavedCanvas,
    handleOpenCanvasOnSelectedSnapshot: openAndManage.handleOpenSavedCanvasOnSelectedSnapshot,
    handleDeleteCanvas: openAndManage.handleDeleteSavedCanvas,
    handleRefreshRecords: loadSavedCanvasRecords,
    handleSyncNow: syncActions.handleSyncSavedCanvasesNow,
  };
}
