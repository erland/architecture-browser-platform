import type { FullSnapshotPayload } from '../../app-model';
import { getOrBuildBrowserSnapshotIndex } from '../../browserSnapshotIndex';
import type { BrowserCanvasLayoutMode, BrowserSessionState } from '../../browserSessionStore';
import type { CreateSavedCanvasDocumentInput, SavedCanvasDocument, SavedCanvasItemReference } from '../model/document';
import { resolveSavedCanvasReferenceWithFallback } from '../rebinding/stableReferences';

export type CreateSavedCanvasFromBrowserSessionOptions = {
  state: BrowserSessionState;
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
  state: BrowserSessionState;
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

export function normalizeCanvasLayoutMode(layoutMode: string | null | undefined): BrowserCanvasLayoutMode {
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
