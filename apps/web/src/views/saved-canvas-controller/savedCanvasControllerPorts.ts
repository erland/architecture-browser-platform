import type { SnapshotSummary } from '../../app-model';
import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';
import type { SavedCanvasDocument } from '../../saved-canvas';
import type { SavedCanvasOfflineAvailabilitySummary } from '../../saved-canvas/opening';
import type { SavedCanvasRebindingUiSummary } from '../../saved-canvas/rebinding';
import type { SavedCanvasLocalStore } from '../../saved-canvas/storage';
import type { SavedCanvasSyncService } from '../../saved-canvas/syncing';
import type { SavedCanvasOpenMode } from './savedCanvasOpeningWorkflows';

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
  setRebindingSummary: (value: SavedCanvasRebindingUiSummary | null) => void;
  setIsSavedCanvasDialogOpen: (value: boolean) => void;
  savedCanvasStore: SavedCanvasLocalStore;
  savedCanvasSyncService: SavedCanvasSyncService;
  runSavedCanvasSync: (options?: { silent?: boolean }) => Promise<any>;
  applySavedCanvasSyncResult: (result: any, targetCanvasId?: string | null) => void;
  loadSavedCanvasRecords: (workspaceId?: string | null, repositoryRegistrationId?: string | null) => Promise<any[]>;
  buildOfflineUnavailableMessage: (availability: SavedCanvasOfflineAvailabilitySummary, mode: SavedCanvasOpenMode | 'selected') => string;
};

export function createSavedCanvasCommandPorts<T extends SavedCanvasCommandPorts>(ports: T): T {
  return ports;
}
