import { useCallback } from 'react';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { AppSelectionState } from '../routing/appSelectionState';
import { type SavedCanvasRebindingUiSummary } from '../saved-canvas/rebinding/ui';
import { type SavedCanvasOfflineAvailabilitySummary } from '../saved-canvas/open/availability';
import type { SavedCanvasOpenMode } from '../saved-canvas/open/load';
import type { SnapshotSummary } from '../appModel';
import type { SavedCanvasDocument } from '../saved-canvas/model/document';
import type { SavedCanvasLocalStore } from '../saved-canvas/storage/localStore';
import type { SavedCanvasSyncService } from '../saved-canvas/sync/service';
import { runDeleteSavedCanvasCommand, runOpenSavedCanvasCommand, runOpenSavedCanvasDialogCommand, runOpenSavedCanvasOnSelectedSnapshotCommand, runSaveCurrentCanvasCommand } from './savedCanvasWorkflows';

export type SavedCanvasOpenAndManageArgs = {
  browserSession: BrowserSessionContextValue;
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
  const commandPorts = {
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
  };

  const handleOpenSavedCanvasDialog = useCallback(async () => {
    try {
      await runOpenSavedCanvasDialogCommand(commandPorts);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to load saved canvases.');
    }
  }, [commandPorts, setSavedCanvasStatusMessage]);

  const handleSaveCurrentCanvas = useCallback(async () => {
    setIsSavedCanvasBusy(true);
    try {
      await runSaveCurrentCanvasCommand(commandPorts);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to save canvas.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  const handleOpenSavedCanvas = useCallback(async (canvasId: string, mode: SavedCanvasOpenMode = 'original') => {
    setIsSavedCanvasBusy(true);
    try {
      await runOpenSavedCanvasCommand(commandPorts, canvasId, mode);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to open saved canvas.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  const handleOpenSavedCanvasOnSelectedSnapshot = useCallback(async (canvasId: string) => {
    setIsSavedCanvasBusy(true);
    try {
      await runOpenSavedCanvasOnSelectedSnapshotCommand(commandPorts, canvasId);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to open saved canvas on the selected snapshot.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  const handleDeleteSavedCanvas = useCallback(async (canvasId: string) => {
    setIsSavedCanvasBusy(true);
    try {
      await runDeleteSavedCanvasCommand(commandPorts, canvasId);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to delete saved canvas.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [commandPorts, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  return {
    handleOpenSavedCanvasDialog,
    handleSaveCurrentCanvas,
    handleOpenSavedCanvas,
    handleOpenSavedCanvasOnSelectedSnapshot,
    handleDeleteSavedCanvas,
  };
}
