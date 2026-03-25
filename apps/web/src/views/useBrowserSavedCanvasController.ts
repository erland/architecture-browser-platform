/**
 * Owns page-driven saved-canvas workflows such as dialog state, open/save/delete,
 * sync-now actions, rebinding, and offline availability. Lower-level storage, sync,
 * mapping, and rebinding rules live inside the saved-canvas subsystem.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { AppSelectionState } from '../routing/appSelectionState';
import { getBrowserSnapshotCache } from '../snapshotCache';
import { getBrowserSavedCanvasLocalStore, type SavedCanvasLocalRecord } from '../saved-canvas/storage/localStore';
import { createSavedCanvasRemoteStore } from '../saved-canvas/storage/remoteStore';
import { createSavedCanvasSyncService } from '../saved-canvas/sync/service';
import { restoreSavedCanvasToBrowserSession } from '../saved-canvas/browser-state/sessionMapping';
import { loadSavedCanvasSnapshotForOpen, loadSelectedTargetSnapshotForSavedCanvasOpen, type SavedCanvasOpenMode } from '../saved-canvas/open/load';
import { buildSavedCanvasDocumentForSave, defaultSavedCanvasName } from '../saved-canvas/browser-state/document';
import { hasSavedCanvasTrackedContentEdits, hasSavedCanvasTrackedNameEdit } from '../saved-canvas/browser-state/editTracking';
import { rebindSavedCanvasToTargetSnapshot } from '../saved-canvas/rebinding/rebind';
import { buildAcceptedSavedCanvasRebindingDocument } from '../saved-canvas/rebinding/accepted';
import { buildSavedCanvasRebindingStatusMessage, toSavedCanvasRebindingUiSummary, type SavedCanvasRebindingUiSummary } from '../saved-canvas/rebinding/ui';
import { buildSavedCanvasOfflineUnavailableMessage, getSavedCanvasOfflineAvailability, type SavedCanvasOfflineAvailabilitySummary } from '../saved-canvas/open/availability';
import type { SavedCanvasDocument } from '../saved-canvas/model/document';
import type { SnapshotSummary } from '../appModel';
import type { useWorkspaceData } from '../hooks/useWorkspaceData';

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
  const [isSavedCanvasDialogOpen, setIsSavedCanvasDialogOpen] = useState(false);
  const [savedCanvasDraftName, setSavedCanvasDraftName] = useState('');
  const [savedCanvasStatusMessage, setSavedCanvasStatusMessage] = useState<string | null>(null);
  const [isSavedCanvasBusy, setIsSavedCanvasBusy] = useState(false);
  const [savedCanvasRecords, setSavedCanvasRecords] = useState<SavedCanvasLocalRecord[]>([]);
  const [currentSavedCanvasId, setCurrentSavedCanvasId] = useState<string | null>(null);
  const [rebindingCanvasId, setRebindingCanvasId] = useState<string | null>(null);
  const [rebindingSummary, setRebindingSummary] = useState<SavedCanvasRebindingUiSummary | null>(null);
  const [savedCanvasAvailabilityById, setSavedCanvasAvailabilityById] = useState<Record<string, SavedCanvasOfflineAvailabilitySummary>>({});
  const [currentSavedCanvasBaseline, setCurrentSavedCanvasBaseline] = useState<SavedCanvasDocument | null>(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);

  const savedCanvasStore = useMemo(() => getBrowserSavedCanvasLocalStore(), []);
  const savedCanvasRemoteStore = useMemo(() => createSavedCanvasRemoteStore(), []);
  const savedCanvasSyncService = useMemo(
    () => createSavedCanvasSyncService(savedCanvasStore, savedCanvasRemoteStore),
    [savedCanvasRemoteStore, savedCanvasStore],
  );

  const loadSavedCanvasRecords = useCallback(async (workspaceId?: string | null, repositoryRegistrationId?: string | null) => {
    const records = await savedCanvasStore.listCanvases({
      workspaceId: workspaceId ?? workspaceData.selectedWorkspaceId ?? selection.selectedWorkspaceId ?? null,
      repositoryRegistrationId: repositoryRegistrationId ?? selectedRepositoryId ?? selection.selectedRepositoryId ?? null,
    });
    setSavedCanvasRecords(records);
    return records;
  }, [savedCanvasStore, selection.selectedRepositoryId, selection.selectedWorkspaceId, selectedRepositoryId, workspaceData.selectedWorkspaceId]);

  const loadSavedCanvasAvailability = useCallback(async (records: SavedCanvasLocalRecord[]) => {
    const cache = getBrowserSnapshotCache();
    const entries = await Promise.all(records.map(async (record) => [
      record.canvasId,
      await getSavedCanvasOfflineAvailability(record, cache, selectedSnapshot),
    ] as const));
    setSavedCanvasAvailabilityById(Object.fromEntries(entries));
  }, [selectedSnapshot]);

  useEffect(() => {
    void loadSavedCanvasAvailability(savedCanvasRecords);
  }, [loadSavedCanvasAvailability, savedCanvasRecords]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleOnlineStateChange = () => setIsOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    handleOnlineStateChange();
    window.addEventListener('online', handleOnlineStateChange);
    window.addEventListener('offline', handleOnlineStateChange);
    return () => {
      window.removeEventListener('online', handleOnlineStateChange);
      window.removeEventListener('offline', handleOnlineStateChange);
    };
  }, []);

  const pendingSavedCanvasSyncCount = useMemo(() => savedCanvasRecords.filter((record) => (
    record.syncState === 'PENDING_SYNC'
      || record.syncState === 'LOCAL_ONLY'
      || record.syncState === 'LOCALLY_MODIFIED'
      || record.syncState === 'DELETED_LOCALLY_PENDING_SYNC'
  )).length, [savedCanvasRecords]);

  const currentSavedCanvasHasLocalEdits = useMemo(() => {
    if (!currentSavedCanvasId || !currentSavedCanvasBaseline) {
      return false;
    }
    if (hasSavedCanvasTrackedNameEdit(savedCanvasDraftName, currentSavedCanvasBaseline)) {
      return true;
    }
    return hasSavedCanvasTrackedContentEdits({
      state: browserSession.state,
      baseline: currentSavedCanvasBaseline,
    });
  }, [browserSession.state, currentSavedCanvasBaseline, currentSavedCanvasId, savedCanvasDraftName]);

  const runSavedCanvasSync = useCallback(async (options?: { silent?: boolean }) => {
    const workspaceId = workspaceData.selectedWorkspaceId ?? selection.selectedWorkspaceId ?? null;
    const repositoryRegistrationId = selectedRepositoryId ?? selection.selectedRepositoryId ?? null;
    const result = await savedCanvasSyncService.syncPendingCanvases({
      workspaceId,
      repositoryRegistrationId,
    });
    await loadSavedCanvasRecords(workspaceId, repositoryRegistrationId);
    if (!options?.silent) {
      const extras: string[] = [];
      if (result.recoveredCount > 0) {
        extras.push(`recovered ${result.recoveredCount}`);
      }
      if (result.retriedCount > 0) {
        extras.push(`retried ${result.retriedCount}`);
      }
      const extrasSuffix = extras.length > 0 ? ` (${extras.join(', ')})` : '';
      if (result.conflictCount > 0) {
        setSavedCanvasStatusMessage(`Saved canvas sync uploaded ${result.uploadedCount}, deleted ${result.deletedCount}, and flagged ${result.conflictCount} conflict(s) for manual review${extrasSuffix}.`);
      } else if (result.failedCount > 0) {
        setSavedCanvasStatusMessage(`Saved canvas sync uploaded ${result.uploadedCount}, deleted ${result.deletedCount}, and left ${result.failedCount} pending${extrasSuffix}.`);
      } else if (result.uploadedCount > 0 || result.deletedCount > 0 || result.recoveredCount > 0) {
        setSavedCanvasStatusMessage(`Saved canvas sync uploaded ${result.uploadedCount} and deleted ${result.deletedCount}${extrasSuffix}.`);
      } else {
        setSavedCanvasStatusMessage('No pending saved canvas sync work.');
      }
    }
    return result;
  }, [loadSavedCanvasRecords, savedCanvasSyncService, selectedRepositoryId, selection.selectedRepositoryId, selection.selectedWorkspaceId, workspaceData.selectedWorkspaceId]);

  const applySavedCanvasSyncResult = useCallback((result: Awaited<ReturnType<typeof runSavedCanvasSync>>, targetCanvasId?: string | null) => {
    const effectiveCanvasId = targetCanvasId ?? currentSavedCanvasId;
    if (!effectiveCanvasId) {
      return;
    }
    const replacement = result.replacedCanvasIds.find((entry) => entry.previousCanvasId === effectiveCanvasId);
    if (replacement) {
      setCurrentSavedCanvasId(replacement.currentCanvasId);
    }
  }, [currentSavedCanvasId]);

  const handleSyncSavedCanvasesNow = useCallback(async () => {
    setIsSavedCanvasBusy(true);
    try {
      const result = await runSavedCanvasSync({ silent: false });
      applySavedCanvasSyncResult(result);
    } catch (caught) {
      setSavedCanvasStatusMessage(caught instanceof Error ? caught.message : 'Failed to sync saved canvases.');
    } finally {
      setIsSavedCanvasBusy(false);
    }
  }, [applySavedCanvasSyncResult, runSavedCanvasSync]);

  useEffect(() => {
    void loadSavedCanvasRecords();
  }, [loadSavedCanvasRecords]);

  useEffect(() => {
    if (!currentSavedCanvasId) {
      setCurrentSavedCanvasBaseline(null);
      return;
    }
    const currentRecord = savedCanvasRecords.find((record) => record.canvasId === currentSavedCanvasId);
    if (currentRecord) {
      setSavedCanvasDraftName(currentRecord.name);
    }
  }, [currentSavedCanvasId, savedCanvasRecords]);

  useEffect(() => {
    if (!currentSavedCanvasId) {
      return;
    }
    const activeSnapshotId = selectedSnapshot?.id ?? browserSession.state.activeSnapshot?.snapshotId ?? null;
    if (!activeSnapshotId) {
      setCurrentSavedCanvasId(null);
      setCurrentSavedCanvasBaseline(null);
      return;
    }
    const currentRecord = savedCanvasRecords.find((record) => record.canvasId === currentSavedCanvasId);
    if (!currentRecord) {
      return;
    }
    if (currentRecord.originSnapshotId !== activeSnapshotId && currentRecord.currentTargetSnapshotId !== activeSnapshotId) {
      setCurrentSavedCanvasId(null);
      setCurrentSavedCanvasBaseline(null);
    }
  }, [browserSession.state.activeSnapshot?.snapshotId, currentSavedCanvasId, savedCanvasRecords, selectedSnapshot?.id]);

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
  }, [applySavedCanvasSyncResult, currentSavedCanvasId, loadSavedCanvasRecords, runSavedCanvasSync, savedCanvasStore, selectedSnapshotLabel]);

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
          throw new Error(buildSavedCanvasOfflineUnavailableMessage(availability, mode));
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
  }, [browserSession, isOffline, savedCanvasAvailabilityById, savedCanvasStore, selectedSnapshot, selection]);

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
        throw new Error(buildSavedCanvasOfflineUnavailableMessage(availability, 'selected'));
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
    isOffline,
    loadSavedCanvasRecords,
    runSavedCanvasSync,
    savedCanvasAvailabilityById,
    savedCanvasStore,
    savedCanvasSyncService,
    selectedSnapshot,
    selection,
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
  ]);

  return {
    isSavedCanvasDialogOpen,
    setIsSavedCanvasDialogOpen,
    draftName: savedCanvasDraftName,
    setDraftName: setSavedCanvasDraftName,
    statusMessage: savedCanvasStatusMessage,
    isBusy: isSavedCanvasBusy,
    records: savedCanvasRecords,
    currentCanvasId: currentSavedCanvasId,
    pendingSyncCount: pendingSavedCanvasSyncCount,
    currentCanvasHasLocalEdits: currentSavedCanvasHasLocalEdits,
    rebindingCanvasId,
    rebindingSummary,
    isOffline,
    availabilityByCanvasId: savedCanvasAvailabilityById,
    handleOpenDialog: handleOpenSavedCanvasDialog,
    handleSaveCurrentCanvas,
    handleOpenCanvas: handleOpenSavedCanvas,
    handleOpenCanvasOnSelectedSnapshot: handleOpenSavedCanvasOnSelectedSnapshot,
    handleDeleteCanvas: handleDeleteSavedCanvas,
    handleRefreshRecords: loadSavedCanvasRecords,
    handleSyncNow: handleSyncSavedCanvasesNow,
  };
}
