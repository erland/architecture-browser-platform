import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserSnapshotCache } from '../../api/snapshotCache';
import { getBrowserSavedCanvasLocalStore, type SavedCanvasLocalRecord } from '../../saved-canvas/storage';
import { createSavedCanvasRemoteStore } from '../../saved-canvas/storage';
import { createSavedCanvasSyncService } from '../../saved-canvas/syncing';
import { buildSavedCanvasOfflineUnavailableMessage, getSavedCanvasOfflineAvailability, type SavedCanvasOfflineAvailabilitySummary } from '../../saved-canvas/opening';
import type { SavedCanvasRebindingUiSummary } from '../../saved-canvas/rebinding';
import { defaultSavedCanvasName } from '../../saved-canvas/browserState';
import { hasSavedCanvasTrackedContentEdits, hasSavedCanvasTrackedNameEdit } from '../../saved-canvas/browserState';
import type { SavedCanvasDocument } from '../../saved-canvas';
import type { SnapshotSummary } from '../../app-model';
import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';

export type SavedCanvasControllerStateArgs = {
  browserSession: BrowserSessionContextValue;
  selectedSnapshot: SnapshotSummary | null;
  selectedSnapshotLabel: string;
};

/**
 * Owns browser-page saved-canvas state that is independent from individual UI actions:
 * records, availability, offline state, current selection, draft name, and rebinding state.
 */
export function useSavedCanvasControllerState({
  browserSession,
  selectedSnapshot,
  selectedSnapshotLabel,
}: SavedCanvasControllerStateArgs) {
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

  const resetCurrentCanvasSelection = useCallback(() => {
    setCurrentSavedCanvasId(null);
    setCurrentSavedCanvasBaseline(null);
    setSavedCanvasDraftName(defaultSavedCanvasName(selectedSnapshotLabel));
  }, [selectedSnapshotLabel]);

  return {
    state: {
      isSavedCanvasDialogOpen,
      setIsSavedCanvasDialogOpen,
      savedCanvasDraftName,
      setSavedCanvasDraftName,
      savedCanvasStatusMessage,
      setSavedCanvasStatusMessage,
      isSavedCanvasBusy,
      setIsSavedCanvasBusy,
      savedCanvasRecords,
      setSavedCanvasRecords,
      currentSavedCanvasId,
      setCurrentSavedCanvasId,
      rebindingCanvasId,
      setRebindingCanvasId,
      rebindingSummary,
      setRebindingSummary,
      savedCanvasAvailabilityById,
      currentSavedCanvasBaseline,
      setCurrentSavedCanvasBaseline,
      isOffline,
      pendingSavedCanvasSyncCount,
      currentSavedCanvasHasLocalEdits,
    },
    services: {
      savedCanvasStore,
      savedCanvasRemoteStore,
      savedCanvasSyncService,
      loadSavedCanvasAvailability,
      buildOfflineUnavailableMessage: buildSavedCanvasOfflineUnavailableMessage,
      resetCurrentCanvasSelection,
    },
  };
}
