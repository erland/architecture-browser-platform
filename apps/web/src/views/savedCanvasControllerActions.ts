import { runDeleteSavedCanvasWorkflow, runSaveCurrentCanvasWorkflow } from './savedCanvasPersistenceWorkflows';
import { runOpenSavedCanvasDialogWorkflow } from './savedCanvasDialogWorkflows';
import { runOpenSavedCanvasOnSelectedSnapshotWorkflow, runOpenSavedCanvasWorkflow, type SavedCanvasOpenMode } from './savedCanvasOpeningWorkflows';
import type { SavedCanvasCommandPorts } from './savedCanvasControllerPorts';

type BusyActionArgs = {
  setBusy: (busy: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  failureMessage: string;
  action: () => Promise<void>;
};

export async function runSavedCanvasBusyControllerAction({
  setBusy,
  setStatusMessage,
  failureMessage,
  action,
}: BusyActionArgs) {
  setBusy(true);
  try {
    await action();
  } catch (caught) {
    setStatusMessage(caught instanceof Error ? caught.message : failureMessage);
  } finally {
    setBusy(false);
  }
}

type PassiveActionArgs = {
  setStatusMessage: (message: string | null) => void;
  failureMessage: string;
  action: () => Promise<void>;
};

export async function runSavedCanvasPassiveControllerAction({
  setStatusMessage,
  failureMessage,
  action,
}: PassiveActionArgs) {
  try {
    await action();
  } catch (caught) {
    setStatusMessage(caught instanceof Error ? caught.message : failureMessage);
  }
}

export async function openSavedCanvasDialog(ports: SavedCanvasCommandPorts) {
  await runOpenSavedCanvasDialogWorkflow(ports);
}

export async function saveCurrentSavedCanvas(ports: SavedCanvasCommandPorts) {
  await runSaveCurrentCanvasWorkflow(ports);
}

export async function openSavedCanvas(ports: SavedCanvasCommandPorts, canvasId: string, mode: SavedCanvasOpenMode = 'original') {
  await runOpenSavedCanvasWorkflow(ports, canvasId, mode);
}

export async function openSavedCanvasOnSelectedSnapshot(ports: SavedCanvasCommandPorts, canvasId: string) {
  await runOpenSavedCanvasOnSelectedSnapshotWorkflow(ports, canvasId);
}

export async function deleteSavedCanvas(ports: SavedCanvasCommandPorts, canvasId: string) {
  await runDeleteSavedCanvasWorkflow(ports, canvasId);
}
