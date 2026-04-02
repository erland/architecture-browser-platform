import type { SavedCanvasBrowserSessionState } from '../../adapters/browser-session-impl/browserSession';
import type { SavedCanvasDocument } from '../../domain/model/document';
import { createSavedCanvasDocumentFromBrowserSession } from './sessionMapping';

export function createSavedCanvasId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultSavedCanvasName(snapshotKey: string | null | undefined) {
  const suffix = snapshotKey?.trim() ? ` — ${snapshotKey.trim()}` : '';
  return `Saved canvas${suffix}`;
}

export function buildSavedCanvasDocumentForSave(options: {
  state: SavedCanvasBrowserSessionState;
  name: string;
  existing?: SavedCanvasDocument | null;
  now?: string;
}) {
  const trimmedName = options.name.trim();
  if (!trimmedName) {
    throw new Error('Saved canvas name is required.');
  }
  const now = options.now ?? new Date().toISOString();
  const document = createSavedCanvasDocumentFromBrowserSession({
    state: options.state,
    canvasId: options.existing?.canvasId ?? createSavedCanvasId(),
    name: trimmedName,
    syncState: options.existing ? 'LOCALLY_MODIFIED' : 'LOCAL_ONLY',
    localVersion: (options.existing?.sync.localVersion ?? 0) + 1,
    backendVersion: options.existing?.sync.backendVersion ?? null,
    createdAt: options.existing?.metadata.createdAt ?? now,
    updatedAt: now,
    lastModifiedAt: now,
    lastSyncedAt: options.existing?.sync.lastSyncedAt ?? null,
    lastSyncError: options.existing?.sync.lastSyncError ?? null,
  });

  if (!options.existing) {
    return document;
  }

  return {
    ...document,
    bindings: {
      ...document.bindings,
      originSnapshot: options.existing.bindings.originSnapshot,
      currentTargetSnapshot: options.existing.bindings.currentTargetSnapshot ?? document.bindings.currentTargetSnapshot,
      rebinding: options.existing.bindings.rebinding ?? null,
    },
    sync: {
      ...document.sync,
      conflict: options.existing.sync.conflict ?? null,
    },
  };
}
