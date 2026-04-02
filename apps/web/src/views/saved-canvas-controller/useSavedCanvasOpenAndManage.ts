import { useCallback } from 'react';
import type { BrowserSessionSavedCanvasPort } from '../../browser-session/ports/savedCanvas';
import type { AppSelectionState } from '../../routing/appSelectionState';
import type { SavedCanvasRebindingUiSummary, SavedCanvasDocument } from '../../saved-canvas/domain';
import type { SavedCanvasOfflineAvailabilitySummary, SavedCanvasOpenMode, SavedCanvasSyncService } from '../../saved-canvas/application';
import type { SnapshotSummary } from '../../app-model';
import type { SavedCanvasLocalStore } from '../../saved-canvas/adapters';
import { createSavedCanvasCommandPorts } from './savedCanvasControllerPorts';
import { deleteSavedCanvas, openSavedCanvas, openSavedCanvasDialog, openSavedCanvasOnSelectedSnapshot, runSavedCanvasBusyControllerAction, runSavedCanvasPassiveControllerAction, saveCurrentSavedCanvas } from './savedCanvasControllerActions';

export type SavedCanvasOpenAndManageArgs = {
  browserSession: BrowserSessionSavedCanvasPort;
  selection: AppSelectionState & {
    setSelectedWorkspaceId: (value: string | null) => void;
    setSelectedRepositoryId: (value: string | null) => void;
    setSelectedSnapshotId: (value: string | null) => void;
  };
  selectedSnapshot: SnapshotSummary | null;
  selectedSnapshotLabel: string;
  currentSavedCanvasId: string | null;
  currentSavedCanvasBaseline: SavedCanvasDocument | null;
  savedCanvasDraftName: string;
  savedCanvasAvailabilityById: Record<string, SavedCanvasOfflineAvailabilitySummary>;
  isOffline: boolean;
  rebindingCanvasId: string | null;
  setIsSavedCanvasBusy: (busy: boolean) => void;
  setSavedCanvasStatusMessage: (message: string | null) => void;
  setCurrentSavedCanvasId: (value: string | null) => void;
  setCurrentSavedCanvasBaseline: (value: SavedCanvasDocument | null) => void;
  setSavedCanvasDraftName: (value: string) => void;
  setRebindingCanvasId: (value: string | null) => void;
  setRebindingSummary: (value: SavedCanvasRebindingUiSummary | null) => void;
  setIsSavedCanvasDialogOpen: (value: boolean) => void;
  savedCanvasStore: SavedCanvasLocalStore;
  savedCanvasSyncService: SavedCanvasSyncService;
  runSavedCanvasSync: (options?: { silent?: boolean }) => Promise<any>;
  applySavedCanvasSyncResult: (result: any, targetCanvasId?: string | null) => void;
  loadSavedCanvasRecords: (workspaceId?: string | null, repositoryRegistrationId?: string | null) => Promise<any[]>;
  buildOfflineUnavailableMessage: (availability: SavedCanvasOfflineAvailabilitySummary, mode: SavedCanvasOpenMode | 'selected') => string;
};

/**
 * Owns action-oriented saved-canvas flows: open, save, rebind-open, and delete.
 * Shared state, record loading, and sync orchestration live in sibling controller hooks.
 */
export function useSavedCanvasOpenAndManage({
  browserSession,
  selection,
  selectedSnapshot,
  selectedSnapshotLabel,
  currentSavedCanvasId,
  currentSavedCanvasBaseline,
  savedCanvasDraftName,
  savedCanvasAvailabilityById,
  isOffline,
  rebindingCanvasId,
  setIsSavedCanvasBusy,
  setSavedCanvasStatusMessage,
  setCurrentSavedCanvasId,
  setCurrentSavedCanvasBaseline,
  setSavedCanvasDraftName,
  setRebindingCanvasId,
  setRebindingSummary,
  setIsSavedCanvasDialogOpen,
  savedCanvasStore,
  savedCanvasSyncService,
  runSavedCanvasSync,
  applySavedCanvasSyncResult,
  loadSavedCanvasRecords,
  buildOfflineUnavailableMessage,
}: SavedCanvasOpenAndManageArgs) {
  const commandPorts = createSavedCanvasCommandPorts({
    browserSession,
    selection,
    selectedSnapshot,
    selectedSnapshotLabel,
    currentSavedCanvasId,
    currentSavedCanvasBaseline,
    savedCanvasDraftName,
    savedCanvasAvailabilityById,
    isOffline,
    rebindingCanvasId,
    setSavedCanvasStatusMessage,
    setCurrentSavedCanvasId,
    setCurrentSavedCanvasBaseline,
    setSavedCanvasDraftName,
    setRebindingCanvasId,
    setRebindingSummary,
    setIsSavedCanvasDialogOpen,
    savedCanvasStore,
    savedCanvasSyncService,
    runSavedCanvasSync,
    applySavedCanvasSyncResult,
    loadSavedCanvasRecords,
    buildOfflineUnavailableMessage,
  });

  const handleOpenSavedCanvasDialog = useCallback(async () => runSavedCanvasPassiveControllerAction({
    setStatusMessage: setSavedCanvasStatusMessage,
    failureMessage: 'Failed to load saved canvases.',
    action: () => openSavedCanvasDialog(commandPorts),
  }), [commandPorts, setSavedCanvasStatusMessage]);

  const handleSaveCurrentCanvas = useCallback(async () => runSavedCanvasBusyControllerAction({
    setBusy: setIsSavedCanvasBusy,
    setStatusMessage: setSavedCanvasStatusMessage,
    failureMessage: 'Failed to save canvas.',
    action: () => saveCurrentSavedCanvas(commandPorts),
  }), [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  const handleOpenSavedCanvas = useCallback(async (canvasId: string, mode: SavedCanvasOpenMode = 'original') => runSavedCanvasBusyControllerAction({
    setBusy: setIsSavedCanvasBusy,
    setStatusMessage: setSavedCanvasStatusMessage,
    failureMessage: 'Failed to open saved canvas.',
    action: () => openSavedCanvas(commandPorts, canvasId, mode),
  }), [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  const handleOpenSavedCanvasOnSelectedSnapshot = useCallback(async (canvasId: string) => runSavedCanvasBusyControllerAction({
    setBusy: setIsSavedCanvasBusy,
    setStatusMessage: setSavedCanvasStatusMessage,
    failureMessage: 'Failed to open saved canvas on the selected snapshot.',
    action: () => openSavedCanvasOnSelectedSnapshot(commandPorts, canvasId),
  }), [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  const handleDeleteSavedCanvas = useCallback(async (canvasId: string) => runSavedCanvasBusyControllerAction({
    setBusy: setIsSavedCanvasBusy,
    setStatusMessage: setSavedCanvasStatusMessage,
    failureMessage: 'Failed to delete saved canvas.',
    action: () => deleteSavedCanvas(commandPorts, canvasId),
  }), [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  return {
    handleOpenSavedCanvasDialog,
    handleSaveCurrentCanvas,
    handleOpenSavedCanvas,
    handleOpenSavedCanvasOnSelectedSnapshot,
    handleDeleteSavedCanvas,
  };
}
