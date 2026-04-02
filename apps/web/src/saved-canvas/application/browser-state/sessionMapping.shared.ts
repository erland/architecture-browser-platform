import type { FullSnapshotPayload } from '../../../app-model';
import { getOrBuildBrowserSnapshotIndex } from '../../../browser-snapshot';
import type {
  SavedCanvasBrowserCanvasLayoutMode,
  SavedCanvasBrowserSessionState,
} from '../../adapters/browser-session-impl/browserSession';
import type { CreateSavedCanvasDocumentInput, SavedCanvasDocument, SavedCanvasItemReference } from '../../domain/model/document';
import { resolveSavedCanvasReferenceWithFallback } from '../../domain/rebinding-impl/stableReferences';

export type CreateSavedCanvasFromBrowserSessionOptions = {
  state: SavedCanvasBrowserSessionState;
  canvasId: string;
  name: string;
  syncState?: CreateSavedCanvasDocumentInput['syncState'];
  localVersion?: number;
  backendVersion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastModifiedAt?: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
};

export type RestoreSavedCanvasToBrowserSessionOptions = {
  document: SavedCanvasDocument;
  payload: FullSnapshotPayload;
  preparedAt?: string;
};

export type RestoreSavedCanvasToBrowserSessionResult = {
  state: SavedCanvasBrowserSessionState;
  unresolvedNodeIds: string[];
  unresolvedEdgeIds: string[];
};

export type BrowserSnapshotIndex = ReturnType<typeof getOrBuildBrowserSnapshotIndex>;

export function resolveSavedCanvasReferenceId(
  reference: SavedCanvasItemReference,
  index: BrowserSnapshotIndex,
): string | null {
  return resolveSavedCanvasReferenceWithFallback(index, reference).resolvedId;
}

export function normalizeCanvasLayoutMode(layoutMode: string | null | undefined): SavedCanvasBrowserCanvasLayoutMode {
  return layoutMode === 'radial'
    ? 'radial'
    : layoutMode === 'structure'
      ? 'structure'
      : layoutMode === 'flow'
        ? 'flow'
        : layoutMode === 'hierarchy'
          ? 'hierarchy'
          : 'grid';
}
