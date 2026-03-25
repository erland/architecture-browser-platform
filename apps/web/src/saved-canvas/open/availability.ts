import type { SnapshotSummary } from '../../appModel.api';
import type { SnapshotCache } from '../../snapshotCache';
import type { SavedCanvasLocalRecord, SavedCanvasLocalRecord as _SavedCanvasLocalRecord } from '../storage/localStore';

export type SavedCanvasSnapshotOfflineStatus = {
  snapshotId: string;
  snapshotLabel: string;
  availableOffline: boolean;
};

export type SavedCanvasOfflineAvailabilitySummary = {
  canvasId: string;
  origin: SavedCanvasSnapshotOfflineStatus;
  currentTarget: SavedCanvasSnapshotOfflineStatus | null;
  selected: SavedCanvasSnapshotOfflineStatus | null;
  availableAlternativeModes: Array<'original' | 'currentTarget' | 'selected'>;
};

function label(snapshotId: string, snapshotKey?: string | null) {
  return snapshotKey || snapshotId;
}

export async function getSavedCanvasOfflineAvailability(
  record: SavedCanvasLocalRecord,
  cache: SnapshotCache,
  selectedSnapshot?: SnapshotSummary | null,
): Promise<SavedCanvasOfflineAvailabilitySummary> {
  const idsToCheck = new Set<string>();
  idsToCheck.add(record.originSnapshotId);
  if (record.currentTargetSnapshotId) {
    idsToCheck.add(record.currentTargetSnapshotId);
  }
  if (selectedSnapshot?.id) {
    idsToCheck.add(selectedSnapshot.id);
  }

  const availabilityById = new Map<string, boolean>();
  await Promise.all([...idsToCheck].map(async (snapshotId) => {
    availabilityById.set(snapshotId, await cache.hasSnapshot(snapshotId));
  }));

  const origin: SavedCanvasSnapshotOfflineStatus = {
    snapshotId: record.originSnapshotId,
    snapshotLabel: label(record.originSnapshotId, record.document.bindings.originSnapshot.snapshotKey),
    availableOffline: availabilityById.get(record.originSnapshotId) ?? false,
  };

  const currentTarget = record.currentTargetSnapshotId
    ? {
        snapshotId: record.currentTargetSnapshotId,
        snapshotLabel: label(
          record.currentTargetSnapshotId,
          record.document.bindings.currentTargetSnapshot?.snapshotKey ?? record.document.bindings.originSnapshot.snapshotKey,
        ),
        availableOffline: availabilityById.get(record.currentTargetSnapshotId) ?? false,
      }
    : null;

  const selected = selectedSnapshot
    ? {
        snapshotId: selectedSnapshot.id,
        snapshotLabel: label(selectedSnapshot.id, selectedSnapshot.snapshotKey),
        availableOffline: availabilityById.get(selectedSnapshot.id) ?? false,
      }
    : null;

  const availableAlternativeModes: Array<'original' | 'currentTarget' | 'selected'> = [];
  if (origin.availableOffline) {
    availableAlternativeModes.push('original');
  }
  if (currentTarget && currentTarget.snapshotId !== origin.snapshotId && currentTarget.availableOffline) {
    availableAlternativeModes.push('currentTarget');
  }
  if (
    selected
    && selected.snapshotId !== origin.snapshotId
    && selected.snapshotId !== currentTarget?.snapshotId
    && selected.availableOffline
  ) {
    availableAlternativeModes.push('selected');
  }

  return {
    canvasId: record.canvasId,
    origin,
    currentTarget,
    selected,
    availableAlternativeModes,
  };
}

export function buildSavedCanvasOfflineUnavailableMessage(
  summary: SavedCanvasOfflineAvailabilitySummary,
  requestedMode: 'original' | 'currentTarget' | 'selected',
): string {
  const requested = requestedMode === 'original'
    ? summary.origin
    : requestedMode === 'currentTarget'
      ? summary.currentTarget
      : summary.selected;

  const requestedLabel = requestedMode === 'original'
    ? 'original snapshot'
    : requestedMode === 'currentTarget'
      ? 'current target snapshot'
      : 'selected snapshot';

  const snapshotLabel = requested?.snapshotLabel ?? 'requested snapshot';

  const alternatives = summary.availableAlternativeModes.filter((mode) => mode !== requestedMode);
  if (alternatives.length === 0) {
    return `The saved canvas ${requestedLabel} ${snapshotLabel} is not available offline.`;
  }

  const alternativeLabels = alternatives.map((mode) => {
    if (mode === 'original') {
      return `Open original (${summary.origin.snapshotLabel})`;
    }
    if (mode === 'currentTarget' && summary.currentTarget) {
      return `Open current (${summary.currentTarget.snapshotLabel})`;
    }
    if (mode === 'selected' && summary.selected) {
      return `Open selected (${summary.selected.snapshotLabel})`;
    }
    return null;
  }).filter((value): value is string => Boolean(value));

  return `The saved canvas ${requestedLabel} ${snapshotLabel} is not available offline. Available offline instead: ${alternativeLabels.join(', ')}.`;
}
