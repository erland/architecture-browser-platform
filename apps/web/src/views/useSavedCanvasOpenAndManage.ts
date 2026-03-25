import { useCallback } from 'react';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { AppSelectionState } from '../routing/appSelectionState';
import { getBrowserSnapshotCache } from '../snapshotCache';
import { restoreSavedCanvasToBrowserSession } from '../saved-canvas/browser-state/sessionMapping';
import { loadSavedCanvasSnapshotForOpen, loadSelectedTargetSnapshotForSavedCanvasOpen, type SavedCanvasOpenMode } from '../saved-canvas/open/load';
import { buildSavedCanvasDocumentForSave, defaultSavedCanvasName } from '../saved-canvas/browser-state/document';
import { rebindSavedCanvasToTargetSnapshot } from '../saved-canvas/rebinding/rebind';
import { buildAcceptedSavedCanvasRebindingDocument } from '../saved-canvas/rebinding/accepted';
import { buildSavedCanvasRebindingStatusMessage, toSavedCanvasRebindingUiSummary, type SavedCanvasRebindingUiSummary } from '../saved-canvas/rebinding/ui';
import { getSavedCanvasOfflineAvailability, type SavedCanvasOfflineAvailabilitySummary } from '../saved-canvas/open/availability';
import type { SnapshotSummary } from '../appModel';
import type { SavedCanvasDocument } from '../saved-canvas/model/document';
import type { SavedCanvasLocalStore } from '../saved-canvas/storage/localStore';
import type { SavedCanvasSyncService } from '../saved-canvas/sync/service';

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
  const handleOpenSavedCanvasDialog = useCallback(async () => {
    try {
      const currentRecord = currentSavedCanvasId ? await savedCanvasStore.getCanvas(currentSavedCanvasId) : null;
      setSavedCanvasDraftName(currentRecord?.name ?? defaultSavedCanvasName(selectedSnapshotLabel));
      setSavedCanvasStatusMessage(null);
      setIsSavedCanvasDialogOpen(true);
      applySavedCanvasSyncResult(await runSavedCanvasSync({ silent: true }));
      await loadSavedCanvasRecords();
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to load saved canvases.');
    }
  }, [applySavedCanvasSyncResult, currentSavedCanvasId, loadSavedCanvasRecords, runSavedCanvasSync, savedCanvasStore, selectedSnapshotLabel, setIsSavedCanvasDialogOpen, setSavedCanvasDraftName, setSavedCanvasStatusMessage]);

  const handleSaveCurrentCanvas = useCallback(async () => {
    if (!browserSession.state.activeSnapshot || !browserSession.state.payload || !browserSession.state.index) {
      setSavedCanvasStatusMessage('Open a prepared Browser snapshot before saving a canvas.');
      return;
    }
    setIsSavedCanvasBusy(true);
    try {
      const existingRecord = currentSavedCanvasId ? await savedCanvasStore.getCanvas(currentSavedCanvasId) : null;
      const document = buildSavedCanvasDocumentForSave({
        state: browserSession.state,
        name: savedCanvasDraftName,
        existing: currentSavedCanvasBaseline ?? existingRecord?.document ?? null,
      });
      const savedRecord = await savedCanvasStore.putCanvas(document);
      const pendingRecord = await savedCanvasSyncService.markCanvasPendingSync(savedRecord.document);
      setCurrentSavedCanvasId(pendingRecord.canvasId);
      setCurrentSavedCanvasBaseline(pendingRecord.document);
      setSavedCanvasDraftName(pendingRecord.name);
      setRebindingCanvasId(null);
      setRebindingSummary(null);
      setSavedCanvasStatusMessage(`Saved ${pendingRecord.name} locally. Sync queued.`);
      await loadSavedCanvasRecords(pendingRecord.workspaceId, pendingRecord.repositoryRegistrationId);
      applySavedCanvasSyncResult(await runSavedCanvasSync({ silent: false }), pendingRecord.canvasId);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to save canvas.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [
    applySavedCanvasSyncResult,
    browserSession.state,
    currentSavedCanvasBaseline,
    currentSavedCanvasId,
    loadSavedCanvasRecords,
    runSavedCanvasSync,
    savedCanvasDraftName,
    savedCanvasStore,
    savedCanvasSyncService,
    setCurrentSavedCanvasBaseline,
    setCurrentSavedCanvasId,
    setIsSavedCanvasBusy,
    setRebindingCanvasId,
    setRebindingSummary,
    setSavedCanvasDraftName,
    setSavedCanvasStatusMessage,
  ]);

  const handleOpenSavedCanvas = useCallback(async (canvasId: string, mode: SavedCanvasOpenMode = 'original') => {
    setIsSavedCanvasBusy(true);
    try {
      const record = await savedCanvasStore.getCanvas(canvasId);
      if (!record) {
        throw new Error('Saved canvas could not be found.');
      }
      const availability = savedCanvasAvailabilityById[canvasId] ?? await getSavedCanvasOfflineAvailability(record, getBrowserSnapshotCache(), selectedSnapshot);
      if (isOffline) {
        const requestedAvailable = mode === 'original'
          ? availability.origin.availableOffline
          : (availability.currentTarget?.availableOffline ?? false);
        if (!requestedAvailable) {
          throw new Error(buildOfflineUnavailableMessage(availability, mode));
        }
      }
      const cache = getBrowserSnapshotCache();
      const openedSnapshot = await loadSavedCanvasSnapshotForOpen(record.document, cache, mode);
      const documentForOpen = mode === 'original'
        ? {
            ...record.document,
            bindings: {
              ...record.document.bindings,
              currentTargetSnapshot: record.document.bindings.originSnapshot,
            },
          }
        : record.document;
      const restored = restoreSavedCanvasToBrowserSession({
        document: documentForOpen,
        payload: openedSnapshot.payload,
        preparedAt: openedSnapshot.preparedAt,
      });
      browserSession.replaceState(restored.state);
      const snapshotRef = openedSnapshot.snapshotRef;
      selection.setSelectedWorkspaceId(snapshotRef.workspaceId);
      selection.setSelectedRepositoryId(snapshotRef.repositoryRegistrationId);
      selection.setSelectedSnapshotId(snapshotRef.snapshotId);
      setCurrentSavedCanvasId(record.canvasId);
      setCurrentSavedCanvasBaseline(documentForOpen);
      setSavedCanvasDraftName(record.name);
      setRebindingCanvasId(null);
      setRebindingSummary(null);
      const unresolvedCount = restored.unresolvedNodeIds.length + restored.unresolvedEdgeIds.length;
      const modeLabel = mode === 'original' ? 'original snapshot' : 'current target snapshot';
      const availabilityLabel = openedSnapshot.availability === 'fetched-remotely' ? ' after fetching the snapshot' : '';
      setSavedCanvasStatusMessage(unresolvedCount > 0 ? `Opened ${record.name} on the ${modeLabel}${availabilityLabel} with ${unresolvedCount} unresolved canvas item(s).` : `Opened ${record.name} on the ${modeLabel}${availabilityLabel}.`);
      setIsSavedCanvasDialogOpen(false);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to open saved canvas.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [browserSession, buildOfflineUnavailableMessage, isOffline, savedCanvasAvailabilityById, savedCanvasStore, selectedSnapshot, selection, setCurrentSavedCanvasBaseline, setCurrentSavedCanvasId, setIsSavedCanvasBusy, setIsSavedCanvasDialogOpen, setRebindingCanvasId, setRebindingSummary, setSavedCanvasDraftName, setSavedCanvasStatusMessage]);

  const handleOpenSavedCanvasOnSelectedSnapshot = useCallback(async (canvasId: string) => {
    if (!selectedSnapshot) {
      setSavedCanvasStatusMessage('Select the target snapshot you want to rebind to before opening a saved canvas on it.');
      return;
    }
    setIsSavedCanvasBusy(true);
    try {
      const record = await savedCanvasStore.getCanvas(canvasId);
      if (!record) {
        throw new Error('Saved canvas could not be found.');
      }
      const availability = savedCanvasAvailabilityById[canvasId] ?? await getSavedCanvasOfflineAvailability(record, getBrowserSnapshotCache(), selectedSnapshot);
      if (isOffline && !availability.selected?.availableOffline) {
        throw new Error(buildOfflineUnavailableMessage(availability, 'selected'));
      }
      const cache = getBrowserSnapshotCache();
      const openedSnapshot = await loadSelectedTargetSnapshotForSavedCanvasOpen(selectedSnapshot, cache);
      const rebound = rebindSavedCanvasToTargetSnapshot(record.document, selectedSnapshot, openedSnapshot.payload, openedSnapshot.preparedAt);
      const acceptedRebindingDocument = buildAcceptedSavedCanvasRebindingDocument({
        baseline: record.document,
        rebound: rebound.document,
        acceptedAt: openedSnapshot.preparedAt,
      });
      const persistedAcceptedRecord = await savedCanvasStore.putCanvas(acceptedRebindingDocument);
      const pendingAcceptedRecord = await savedCanvasSyncService.markCanvasPendingSync(persistedAcceptedRecord.document, openedSnapshot.preparedAt);
      const restored = restoreSavedCanvasToBrowserSession({
        document: pendingAcceptedRecord.document,
        payload: openedSnapshot.payload,
        preparedAt: openedSnapshot.preparedAt,
      });
      browserSession.replaceState(restored.state);
      selection.setSelectedWorkspaceId(selectedSnapshot.workspaceId);
      selection.setSelectedRepositoryId(selectedSnapshot.repositoryRegistrationId);
      selection.setSelectedSnapshotId(selectedSnapshot.id);
      setCurrentSavedCanvasId(pendingAcceptedRecord.canvasId);
      setCurrentSavedCanvasBaseline(pendingAcceptedRecord.document);
      setSavedCanvasDraftName(pendingAcceptedRecord.name);
      await loadSavedCanvasRecords(pendingAcceptedRecord.workspaceId, pendingAcceptedRecord.repositoryRegistrationId);
      applySavedCanvasSyncResult(await runSavedCanvasSync({ silent: true }), pendingAcceptedRecord.canvasId);
      const summary = toSavedCanvasRebindingUiSummary(rebound);
      setRebindingCanvasId(pendingAcceptedRecord.canvasId);
      setRebindingSummary(summary);
      const availabilityLabel = openedSnapshot.availability === 'fetched-remotely' ? ' after fetching the snapshot' : '';
      setSavedCanvasStatusMessage(`${buildSavedCanvasRebindingStatusMessage({
        canvasName: pendingAcceptedRecord.name,
        targetSnapshotLabel: selectedSnapshot.snapshotKey,
        availabilityLabel,
        summary,
      })} Accepted remap metadata was saved for future opens.`);
      setIsSavedCanvasDialogOpen(summary.unresolvedCount > 0);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to open saved canvas on the selected snapshot.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [
    applySavedCanvasSyncResult,
    browserSession,
    buildOfflineUnavailableMessage,
    isOffline,
    loadSavedCanvasRecords,
    runSavedCanvasSync,
    savedCanvasAvailabilityById,
    savedCanvasStore,
    savedCanvasSyncService,
    selectedSnapshot,
    selection,
    setCurrentSavedCanvasBaseline,
    setCurrentSavedCanvasId,
    setIsSavedCanvasBusy,
    setIsSavedCanvasDialogOpen,
    setRebindingCanvasId,
    setRebindingSummary,
    setSavedCanvasDraftName,
    setSavedCanvasStatusMessage,
  ]);

  const handleDeleteSavedCanvas = useCallback(async (canvasId: string) => {
    setIsSavedCanvasBusy(true);
    try {
      const existingRecord = await savedCanvasStore.getCanvas(canvasId);
      if (!existingRecord) {
        throw new Error('Saved canvas could not be found.');
      }
      await savedCanvasSyncService.markCanvasDeletedPendingSync(existingRecord);
      if (currentSavedCanvasId === canvasId) {
        setCurrentSavedCanvasId(null);
        setCurrentSavedCanvasBaseline(null);
        setSavedCanvasDraftName(defaultSavedCanvasName(selectedSnapshotLabel));
      }
      if (rebindingCanvasId === canvasId) {
        setRebindingCanvasId(null);
        setRebindingSummary(null);
      }
      await loadSavedCanvasRecords();
      setSavedCanvasStatusMessage(existingRecord.syncState === 'SYNCHRONIZED' || existingRecord.document.sync.backendVersion
        ? 'Saved canvas marked for deletion. Sync queued.'
        : 'Saved canvas deleted locally.');
      applySavedCanvasSyncResult(await runSavedCanvasSync({ silent: false }));
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to delete saved canvas.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [
    applySavedCanvasSyncResult,
    currentSavedCanvasId,
    loadSavedCanvasRecords,
    rebindingCanvasId,
    runSavedCanvasSync,
    savedCanvasStore,
    savedCanvasSyncService,
    selectedSnapshotLabel,
    setCurrentSavedCanvasBaseline,
    setCurrentSavedCanvasId,
    setIsSavedCanvasBusy,
    setRebindingCanvasId,
    setRebindingSummary,
    setSavedCanvasDraftName,
    setSavedCanvasStatusMessage,
  ]);

  return {
    handleOpenSavedCanvasDialog,
    handleSaveCurrentCanvas,
    handleOpenSavedCanvas,
    handleOpenSavedCanvasOnSelectedSnapshot,
    handleDeleteSavedCanvas,
  };
}
