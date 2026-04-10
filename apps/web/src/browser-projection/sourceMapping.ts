import type { FullSnapshotEntity, FullSnapshotScope } from '../app-model';
import type { BrowserCanvasNode, BrowserSessionState } from '../browser-session/types';

export type BrowserProjectionResolvedSource =
  | { kind: 'scope'; scope: FullSnapshotScope }
  | { kind: 'entity'; entity: FullSnapshotEntity };

export function compareProjectionStrings(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

export function displayProjectionName(item: { displayName: string | null; name: string }) {
  return item.displayName?.trim() || item.name;
}

export function formatProjectionKindBadgeLabel(kind: string) {
  return kind
    .toLowerCase()
    .split(/[_-]+/g)
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : part)
    .join(' ');
}

export function resolveProjectionSourceForCanvasNode(
  state: BrowserSessionState,
  canvasNode: BrowserCanvasNode,
): BrowserProjectionResolvedSource | null {
  const index = state.index;
  if (!index) {
    return null;
  }

  if (canvasNode.kind === 'scope') {
    const scope = index.scopesById.get(canvasNode.id);
    return scope ? { kind: 'scope', scope } : null;
  }

  const entity = index.entitiesById.get(canvasNode.id);
  return entity ? { kind: 'entity', entity } : null;
}
