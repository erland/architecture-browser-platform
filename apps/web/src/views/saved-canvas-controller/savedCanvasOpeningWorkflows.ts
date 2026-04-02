import { getBrowserSnapshotCache } from '../../api/snapshotCache';
import { restoreSavedCanvasToBrowserSession } from '../../saved-canvas/application';
import { getSavedCanvasOfflineAvailability, loadSavedCanvasSnapshotForOpen, loadSelectedTargetSnapshotForSavedCanvasOpen, type SavedCanvasOpenMode } from '../../saved-canvas/application';
import { buildAcceptedSavedCanvasRebindingDocument, rebindSavedCanvasToTargetSnapshot } from '../../saved-canvas/domain';
import { buildSavedCanvasRebindingStatusMessage, toSavedCanvasRebindingUiSummary } from '../../saved-canvas';
import type { SavedCanvasCommandPorts } from './savedCanvasControllerPorts';

export async function runOpenSavedCanvasWorkflow(
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
  ports.browserSession.lifecycle.replaceState(restored.state as any);
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

export async function runOpenSavedCanvasOnSelectedSnapshotWorkflow(
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
  ports.browserSession.lifecycle.replaceState(restored.state as any);
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

export type { SavedCanvasOpenMode };
