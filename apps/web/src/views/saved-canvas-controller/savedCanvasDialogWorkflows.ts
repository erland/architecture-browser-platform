import { defaultSavedCanvasName } from '../../saved-canvas/application';
import type { SavedCanvasCommandPorts } from './savedCanvasControllerPorts';

export async function runOpenSavedCanvasDialogWorkflow(ports: Pick<SavedCanvasCommandPorts,
  'currentSavedCanvasId' | 'savedCanvasStore' | 'selectedSnapshotLabel' | 'setSavedCanvasDraftName' | 'setSavedCanvasStatusMessage' | 'setIsSavedCanvasDialogOpen' | 'applySavedCanvasSyncResult' | 'runSavedCanvasSync' | 'loadSavedCanvasRecords'>,
) {
  const currentRecord = ports.currentSavedCanvasId ? await ports.savedCanvasStore.getCanvas(ports.currentSavedCanvasId) : null;
  ports.setSavedCanvasDraftName(currentRecord?.name ?? defaultSavedCanvasName(ports.selectedSnapshotLabel));
  ports.setSavedCanvasStatusMessage(null);
  ports.setIsSavedCanvasDialogOpen(true);
  ports.applySavedCanvasSyncResult(await ports.runSavedCanvasSync({ silent: true }));
  await ports.loadSavedCanvasRecords();
}
