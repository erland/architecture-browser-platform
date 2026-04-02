import { useCallback, useEffect } from 'react';
import { runSavedCanvasBusyControllerAction } from './savedCanvasControllerActions';

type LoadSavedCanvasRecordsArgs = {
  savedCanvasStore: {
    listCanvases: (args: { workspaceId: string | null; repositoryRegistrationId: string | null }) => Promise<any[]>;
  };
  selectedWorkspaceId: string | null;
  selectedRepositoryId: string | null;
  setSavedCanvasRecords: (records: any[]) => void;
};

export function useSavedCanvasRecords({
  savedCanvasStore,
  selectedWorkspaceId,
  selectedRepositoryId,
  setSavedCanvasRecords,
}: LoadSavedCanvasRecordsArgs) {
  return useCallback(async (workspaceId?: string | null, repositoryRegistrationId?: string | null) => {
    const records = await savedCanvasStore.listCanvases({
      workspaceId: workspaceId ?? selectedWorkspaceId ?? null,
      repositoryRegistrationId: repositoryRegistrationId ?? selectedRepositoryId ?? null,
    });
    setSavedCanvasRecords(records);
    return records;
  }, [savedCanvasStore, selectedRepositoryId, selectedWorkspaceId, setSavedCanvasRecords]);
}

type UseSavedCanvasSyncArgs = {
  selectedWorkspaceId: string | null;
  selectedRepositoryId: string | null;
  savedCanvasSyncService: {
    syncPendingCanvases: (args: { workspaceId: string | null; repositoryRegistrationId: string | null }) => Promise<any>;
  };
  loadSavedCanvasRecords: (workspaceId?: string | null, repositoryRegistrationId?: string | null) => Promise<any[]>;
  currentSavedCanvasId: string | null;
  setCurrentSavedCanvasId: (canvasId: string | null) => void;
  setSavedCanvasStatusMessage: (message: string | null) => void;
  setIsSavedCanvasBusy: (busy: boolean) => void;
};

export function useSavedCanvasSyncActions({
  selectedWorkspaceId,
  selectedRepositoryId,
  savedCanvasSyncService,
  loadSavedCanvasRecords,
  currentSavedCanvasId,
  setCurrentSavedCanvasId,
  setSavedCanvasStatusMessage,
  setIsSavedCanvasBusy,
}: UseSavedCanvasSyncArgs) {
  const runSavedCanvasSync = useCallback(async (options?: { silent?: boolean }) => {
    const result = await savedCanvasSyncService.syncPendingCanvases({
      workspaceId: selectedWorkspaceId,
      repositoryRegistrationId: selectedRepositoryId,
    });
    await loadSavedCanvasRecords(selectedWorkspaceId, selectedRepositoryId);
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
  }, [loadSavedCanvasRecords, savedCanvasSyncService, selectedRepositoryId, selectedWorkspaceId, setSavedCanvasStatusMessage]);

  const applySavedCanvasSyncResult = useCallback((result: Awaited<ReturnType<typeof runSavedCanvasSync>>, targetCanvasId?: string | null) => {
    const effectiveCanvasId = targetCanvasId ?? currentSavedCanvasId;
    if (!effectiveCanvasId) {
      return;
    }
    const replacement = result.replacedCanvasIds.find((entry: { previousCanvasId: string; currentCanvasId: string }) => entry.previousCanvasId === effectiveCanvasId);
    if (replacement) {
      setCurrentSavedCanvasId(replacement.currentCanvasId);
    }
  }, [currentSavedCanvasId, setCurrentSavedCanvasId]);

  const handleSyncSavedCanvasesNow = useCallback(async () => runSavedCanvasBusyControllerAction({
    setBusy: setIsSavedCanvasBusy,
    setStatusMessage: setSavedCanvasStatusMessage,
    failureMessage: 'Failed to sync saved canvases.',
    action: async () => {
      const result = await runSavedCanvasSync({ silent: false });
      applySavedCanvasSyncResult(result);
    },
  }), [applySavedCanvasSyncResult, runSavedCanvasSync, setIsSavedCanvasBusy, setSavedCanvasStatusMessage]);

  return {
    runSavedCanvasSync,
    applySavedCanvasSyncResult,
    handleSyncSavedCanvasesNow,
  };
}

type UseLoadSavedCanvasRecordsOnMountArgs = {
  loadSavedCanvasRecords: () => Promise<any[]>;
};

export function useLoadSavedCanvasRecordsOnMount({ loadSavedCanvasRecords }: UseLoadSavedCanvasRecordsOnMountArgs) {
  useEffect(() => {
    void loadSavedCanvasRecords();
  }, [loadSavedCanvasRecords]);
}
