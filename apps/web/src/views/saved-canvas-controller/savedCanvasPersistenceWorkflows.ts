import { buildSavedCanvasDocumentForSave, defaultSavedCanvasName } from '../../saved-canvas/browserState';
import type { SavedCanvasCommandPorts } from './savedCanvasControllerPorts';

export async function runSaveCurrentCanvasWorkflow(ports: Pick<SavedCanvasCommandPorts,
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

export async function runDeleteSavedCanvasWorkflow(
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
