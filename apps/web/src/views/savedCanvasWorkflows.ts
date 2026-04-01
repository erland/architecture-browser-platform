import { getBrowserSnapshotCache } from '../snapshotCache';
import { restoreSavedCanvasToBrowserSession } from '../saved-canvas/browser-state/sessionMapping';
import { loadSavedCanvasSnapshotForOpen, loadSelectedTargetSnapshotForSavedCanvasOpen, type SavedCanvasOpenMode } from '../saved-canvas/open/load';
import { buildSavedCanvasDocumentForSave, defaultSavedCanvasName } from '../saved-canvas/browser-state/document';
import { rebindSavedCanvasToTargetSnapshot } from '../saved-canvas/rebinding/rebind';
import { buildAcceptedSavedCanvasRebindingDocument } from '../saved-canvas/rebinding/accepted';
import { buildSavedCanvasRebindingStatusMessage, toSavedCanvasRebindingUiSummary } from '../saved-canvas/rebinding/ui';
import { getSavedCanvasOfflineAvailability, type SavedCanvasOfflineAvailabilitySummary } from '../saved-canvas/open/availability';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { SnapshotSummary } from '../appModel';
import type { SavedCanvasDocument } from '../saved-canvas/model/document';
import type { SavedCanvasLocalStore } from '../saved-canvas/storage/localStore';
import type { SavedCanvasSyncService } from '../saved-canvas/sync/service';

export type SavedCanvasSelectionPorts = {
  setSelectedWorkspaceId: (value: string | null) => void;
  setSelectedRepositoryId: (value: string | null) => void;
  setSelectedSnapshotId: (value: string | null) => void;
};

export type SavedCanvasCommandPorts = {
  browserSession: Pick<BrowserSessionContextValue, 'state' | 'lifecycle'>;
  selection: SavedCanvasSelectionPorts;
  selectedSnapshot: SnapshotSummary | null;
  selectedSnapshotLabel: string;
  currentSavedCanvasId: string | null;
  currentSavedCanvasBaseline: SavedCanvasDocument | null;
  savedCanvasDraftName: string;
  savedCanvasAvailabilityById: Record<string, SavedCanvasOfflineAvailabilitySummary>;
  isOffline: boolean;
  rebindingCanvasId: string | null;
  setSavedCanvasStatusMessage: (message: string | null) => void;
  setCurrentSavedCanvasId: (value: string | null) => void;
  setCurrentSavedCanvasBaseline: (value: SavedCanvasDocument | null) => void;
  setSavedCanvasDraftName: (value: string) => void;
  setRebindingCanvasId: (value: string | null) => void;
  setRebindingSummary: (value: ReturnType<typeof toSavedCanvasRebindingUiSummary> | null) => void;
  setIsSavedCanvasDialogOpen: (value: boolean) => void;
  savedCanvasStore: SavedCanvasLocalStore;
  savedCanvasSyncService: SavedCanvasSyncService;
  runSavedCanvasSync: (options?: { silent?: boolean }) => Promise<any>;
  applySavedCanvasSyncResult: (result: any, targetCanvasId?: string | null) => void;
  loadSavedCanvasRecords: (workspaceId?: string | null, repositoryRegistrationId?: string | null) => Promise<any[]>;
  buildOfflineUnavailableMessage: (availability: SavedCanvasOfflineAvailabilitySummary, mode: SavedCanvasOpenMode | 'selected') => string;
};

export async function runOpenSavedCanvasDialogCommand(ports: Pick<SavedCanvasCommandPorts,
  'currentSavedCanvasId' | 'savedCanvasStore' | 'selectedSnapshotLabel' | 'setSavedCanvasDraftName' | 'setSavedCanvasStatusMessage' | 'setIsSavedCanvasDialogOpen' | 'applySavedCanvasSyncResult' | 'runSavedCanvasSync' | 'loadSavedCanvasRecords'>,
) {
  const currentRecord = ports.currentSavedCanvasId ? await ports.savedCanvasStore.getCanvas(ports.currentSavedCanvasId) : null;
  ports.setSavedCanvasDraftName(currentRecord?.name ?? defaultSavedCanvasName(ports.selectedSnapshotLabel));
  ports.setSavedCanvasStatusMessage(null);
  ports.setIsSavedCanvasDialogOpen(true);
  ports.applySavedCanvasSyncResult(await ports.runSavedCanvasSync({ silent: true }));
  await ports.loadSavedCanvasRecords();
}

export async function runSaveCurrentCanvasCommand(ports: Pick<SavedCanvasCommandPorts,
  'browserSession' | 'currentSavedCanvasId' | 'currentSavedCanvasBaseline' | 'savedCanvasDraftName' | 'savedCanvasStore' | 'savedCanvasSyncService' | 'setCurrentSavedCanvasId' | 'setCurrentSavedCanvasBaseline' | 'setSavedCanvasDraftName' | 'setRebindingCanvasId' | 'setRebindingSummary' | 'setSavedCanvasStatusMessage' | 'loadSavedCanvasRecords' | 'applySavedCanvasSyncResult' | 'runSavedCanvasSync'>,
) {
  if (!ports.browserSession.state.activeSnapshot || !ports.browserSession.state.payload || !ports.browserSession.state.index) {
    throw new Error('Open a prepared Browser snapshot before saving a canvas.');
  }
  const existingRecord = ports.currentSavedCanvasId ? await ports.savedCanvasStore.getCanvas(ports.currentSavedCanvasId) : null;
  const document = buildSavedCanvasDocumentForSave({
    state: ports.browserSession.state,
    name: ports.savedCanvasDraftName,
    existing: ports.currentSavedCanvasBaseline ?? existingRecord?.document ?? null,
  });
  const savedRecord = await ports.savedCanvasStore.putCanvas(document);
  const pendingRecord = await ports.savedCanvasSyncService.markCanvasPendingSync(savedRecord.document);
  ports.setCurrentSavedCanvasId(pendingRecord.canvasId);
  ports.setCurrentSavedCanvasBaseline(pendingRecord.document);
  ports.setSavedCanvasDraftName(pendingRecord.name);
  ports.setRebindingCanvasId(null);
  ports.setRebindingSummary(null);
  ports.setSavedCanvasStatusMessage(`Saved ${pendingRecord.name} locally. Sync queued.`);
  await ports.loadSavedCanvasRecords(pendingRecord.workspaceId, pendingRecord.repositoryRegistrationId);
  ports.applySavedCanvasSyncResult(await ports.runSavedCanvasSync({ silent: false }), pendingRecord.canvasId);
}

export async function runOpenSavedCanvasCommand(
  ports: Pick<SavedCanvasCommandPorts,
    'browserSession' | 'selection' | 'selectedSnapshot' | 'savedCanvasAvailabilityById' | 'isOffline' | 'savedCanvasStore' | 'buildOfflineUnavailableMessage' | 'setCurrentSavedCanvasId' | 'setCurrentSavedCanvasBaseline' | 'setSavedCanvasDraftName' | 'setRebindingCanvasId' | 'setRebindingSummary' | 'setSavedCanvasStatusMessage' | 'setIsSavedCanvasDialogOpen'>,
  canvasId: string,
  mode: SavedCanvasOpenMode = 'original',
) {
  const record = await ports.savedCanvasStore.getCanvas(canvasId);
  if (!record) {
    throw new Error('Saved canvas could not be found.');
  }
  const availability = ports.savedCanvasAvailabilityById[canvasId] ?? await getSavedCanvasOfflineAvailability(record, getBrowserSnapshotCache(), ports.selectedSnapshot);
  if (ports.isOffline) {
    const requestedAvailable = mode === 'original'
      ? availability.origin.availableOffline
      : (availability.currentTarget?.availableOffline ?? false);
    if (!requestedAvailable) {
      throw new Error(ports.buildOfflineUnavailableMessage(availability, mode));
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
  ports.browserSession.lifecycle.replaceState(restored.state);
  const snapshotRef = openedSnapshot.snapshotRef;
  ports.selection.setSelectedWorkspaceId(snapshotRef.workspaceId);
  ports.selection.setSelectedRepositoryId(snapshotRef.repositoryRegistrationId);
  ports.selection.setSelectedSnapshotId(snapshotRef.snapshotId);
  ports.setCurrentSavedCanvasId(record.canvasId);
  ports.setCurrentSavedCanvasBaseline(documentForOpen);
  ports.setSavedCanvasDraftName(record.name);
  ports.setRebindingCanvasId(null);
  ports.setRebindingSummary(null);
  const unresolvedCount = restored.unresolvedNodeIds.length + restored.unresolvedEdgeIds.length;
  const modeLabel = mode === 'original' ? 'original snapshot' : 'current target snapshot';
  const availabilityLabel = openedSnapshot.availability === 'fetched-remotely' ? ' after fetching the snapshot' : '';
  ports.setSavedCanvasStatusMessage(unresolvedCount > 0 ? `Opened ${record.name} on the ${modeLabel}${availabilityLabel} with ${unresolvedCount} unresolved canvas item(s).` : `Opened ${record.name} on the ${modeLabel}${availabilityLabel}.`);
  ports.setIsSavedCanvasDialogOpen(false);
}

export async function runOpenSavedCanvasOnSelectedSnapshotCommand(
  ports: Pick<SavedCanvasCommandPorts,
    'browserSession' | 'selection' | 'selectedSnapshot' | 'savedCanvasAvailabilityById' | 'isOffline' | 'savedCanvasStore' | 'savedCanvasSyncService' | 'buildOfflineUnavailableMessage' | 'setCurrentSavedCanvasId' | 'setCurrentSavedCanvasBaseline' | 'setSavedCanvasDraftName' | 'setRebindingCanvasId' | 'setRebindingSummary' | 'setSavedCanvasStatusMessage' | 'setIsSavedCanvasDialogOpen' | 'loadSavedCanvasRecords' | 'applySavedCanvasSyncResult' | 'runSavedCanvasSync'>,
  canvasId: string,
) {
  if (!ports.selectedSnapshot) {
    throw new Error('Select the target snapshot you want to rebind to before opening a saved canvas on it.');
  }
  const record = await ports.savedCanvasStore.getCanvas(canvasId);
  if (!record) {
    throw new Error('Saved canvas could not be found.');
  }
  const availability = ports.savedCanvasAvailabilityById[canvasId] ?? await getSavedCanvasOfflineAvailability(record, getBrowserSnapshotCache(), ports.selectedSnapshot);
  if (ports.isOffline && !availability.selected?.availableOffline) {
    throw new Error(ports.buildOfflineUnavailableMessage(availability, 'selected'));
  }
  const cache = getBrowserSnapshotCache();
  const openedSnapshot = await loadSelectedTargetSnapshotForSavedCanvasOpen(ports.selectedSnapshot, cache);
  const rebound = rebindSavedCanvasToTargetSnapshot(record.document, ports.selectedSnapshot, openedSnapshot.payload, openedSnapshot.preparedAt);
  const acceptedRebindingDocument = buildAcceptedSavedCanvasRebindingDocument({
    baseline: record.document,
    rebound: rebound.document,
    acceptedAt: openedSnapshot.preparedAt,
  });
  const persistedAcceptedRecord = await ports.savedCanvasStore.putCanvas(acceptedRebindingDocument);
  const pendingAcceptedRecord = await ports.savedCanvasSyncService.markCanvasPendingSync(persistedAcceptedRecord.document, openedSnapshot.preparedAt);
  const restored = restoreSavedCanvasToBrowserSession({
    document: pendingAcceptedRecord.document,
    payload: openedSnapshot.payload,
    preparedAt: openedSnapshot.preparedAt,
  });
  ports.browserSession.lifecycle.replaceState(restored.state);
  ports.selection.setSelectedWorkspaceId(ports.selectedSnapshot.workspaceId);
  ports.selection.setSelectedRepositoryId(ports.selectedSnapshot.repositoryRegistrationId);
  ports.selection.setSelectedSnapshotId(ports.selectedSnapshot.id);
  ports.setCurrentSavedCanvasId(pendingAcceptedRecord.canvasId);
  ports.setCurrentSavedCanvasBaseline(pendingAcceptedRecord.document);
  ports.setSavedCanvasDraftName(pendingAcceptedRecord.name);
  await ports.loadSavedCanvasRecords(pendingAcceptedRecord.workspaceId, pendingAcceptedRecord.repositoryRegistrationId);
  ports.applySavedCanvasSyncResult(await ports.runSavedCanvasSync({ silent: true }), pendingAcceptedRecord.canvasId);
  const summary = toSavedCanvasRebindingUiSummary(rebound);
  ports.setRebindingCanvasId(pendingAcceptedRecord.canvasId);
  ports.setRebindingSummary(summary);
  const availabilityLabel = openedSnapshot.availability === 'fetched-remotely' ? ' after fetching the snapshot' : '';
  ports.setSavedCanvasStatusMessage(`${buildSavedCanvasRebindingStatusMessage({
    canvasName: pendingAcceptedRecord.name,
    targetSnapshotLabel: ports.selectedSnapshot.snapshotKey,
    availabilityLabel,
    summary,
  })} Accepted remap metadata was saved for future opens.`);
  ports.setIsSavedCanvasDialogOpen(summary.unresolvedCount > 0);
}

export async function runDeleteSavedCanvasCommand(
  ports: Pick<SavedCanvasCommandPorts,
    'savedCanvasStore' | 'savedCanvasSyncService' | 'currentSavedCanvasId' | 'rebindingCanvasId' | 'setCurrentSavedCanvasId' | 'setCurrentSavedCanvasBaseline' | 'setSavedCanvasDraftName' | 'setRebindingCanvasId' | 'setRebindingSummary' | 'selectedSnapshotLabel' | 'loadSavedCanvasRecords' | 'setSavedCanvasStatusMessage' | 'applySavedCanvasSyncResult' | 'runSavedCanvasSync'>,
  canvasId: string,
) {
  const existingRecord = await ports.savedCanvasStore.getCanvas(canvasId);
  if (!existingRecord) {
    throw new Error('Saved canvas could not be found.');
  }
  await ports.savedCanvasSyncService.markCanvasDeletedPendingSync(existingRecord);
  if (ports.currentSavedCanvasId === canvasId) {
    ports.setCurrentSavedCanvasId(null);
    ports.setCurrentSavedCanvasBaseline(null);
    ports.setSavedCanvasDraftName(defaultSavedCanvasName(ports.selectedSnapshotLabel));
  }
  if (ports.rebindingCanvasId === canvasId) {
    ports.setRebindingCanvasId(null);
    ports.setRebindingSummary(null);
  }
  await ports.loadSavedCanvasRecords();
  ports.setSavedCanvasStatusMessage(existingRecord.syncState === 'SYNCHRONIZED' || existingRecord.document.sync.backendVersion
    ? 'Saved canvas marked for deletion. Sync queued.'
    : 'Saved canvas deleted locally.');
  ports.applySavedCanvasSyncResult(await ports.runSavedCanvasSync({ silent: false }));
}
