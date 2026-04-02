/**
 * Explicit ports consumed by saved-canvas controller workflows.
 *
 * Browser session access is intentionally narrowed to the saved-canvas port so
 * controller actions do not depend on the full BrowserSessionContext surface.
 */
import type { SnapshotSummary } from '../../app-model';
import type { BrowserSessionSavedCanvasPort } from '../../browser-session/ports/savedCanvas';
import type { SavedCanvasDocument, SavedCanvasRebindingUiSummary } from '../../saved-canvas/domain';
import type { SavedCanvasOfflineAvailabilitySummary, SavedCanvasSyncService } from '../../saved-canvas/application';
import type { SavedCanvasLocalStore } from '../../saved-canvas/adapters';
import type { SavedCanvasOpenMode } from './savedCanvasOpeningWorkflows';

export type SavedCanvasSelectionPorts = {
  setSelectedWorkspaceId: (value: string | null) => void;
  setSelectedRepositoryId: (value: string | null) => void;
  setSelectedSnapshotId: (value: string | null) => void;
};

export type SavedCanvasCommandPorts = {
  browserSession: BrowserSessionSavedCanvasPort;
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
