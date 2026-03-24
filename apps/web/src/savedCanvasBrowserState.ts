import type { BrowserSessionState } from './browserSessionStore';
import type { SavedCanvasDocument } from './savedCanvasModel';
import { createSavedCanvasDocumentFromBrowserSession } from './savedCanvasSessionMapping';

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
  state: BrowserSessionState;
  name: string;
  existing?: SavedCanvasDocument | null;
  now?: string;
}) {
  const trimmedName = options.name.trim();
  if (!trimmedName) {
    throw new Error('Saved canvas name is required.');
  }
  const now = options.now ?? new Date().toISOString();
  return createSavedCanvasDocumentFromBrowserSession({
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
}
