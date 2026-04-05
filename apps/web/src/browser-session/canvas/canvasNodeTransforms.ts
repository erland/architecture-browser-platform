import type { BrowserCanvasNode, BrowserClassPresentationMode } from '../model/types';
import { normalizeBrowserClassPresentationPolicy } from '../model/classPresentation';
import { upsertCanvasNode, upsertPinnedCanvasNode } from './nodes';

export function moveCanvasNodeInCollection(
  canvasNodes: BrowserCanvasNode[],
  node: { kind: BrowserCanvasNode['kind']; id: string },
  position: { x: number; y: number },
): BrowserCanvasNode[] | null {
  const existing = canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  if (!existing) {
    return null;
  }
  return upsertCanvasNode(canvasNodes, {
    kind: node.kind,
    id: node.id,
    x: position.x,
    y: position.y,
    manuallyPlaced: true,
  });
}

export function reconcileCanvasNodePositionsInCollection(
  canvasNodes: BrowserCanvasNode[],
  updates: Array<{ kind: BrowserCanvasNode['kind']; id: string; x?: number; y?: number }>,
): BrowserCanvasNode[] | null {
  if (updates.length === 0) {
    return null;
  }

  let nextCanvasNodes = canvasNodes;
  let changed = false;
  for (const update of updates) {
    const existing = nextCanvasNodes.find((node) => node.kind === update.kind && node.id === update.id);
    if (!existing) {
      continue;
    }
    const nextX = update.x ?? existing.x;
    const nextY = update.y ?? existing.y;
    if (nextX === existing.x && nextY === existing.y) {
      continue;
    }
    nextCanvasNodes = upsertCanvasNode(nextCanvasNodes, {
      kind: update.kind,
      id: update.id,
      x: nextX,
      y: nextY,
      manuallyPlaced: existing.manuallyPlaced,
      pinned: existing.pinned,
    });
    changed = true;
  }

  return changed ? nextCanvasNodes : null;
}

export function toggleCanvasNodePinInCollection(
  canvasNodes: BrowserCanvasNode[],
  node: { kind: BrowserCanvasNode['kind']; id: string },
): BrowserCanvasNode[] {
  const existing = canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  const nextPinned = !existing?.pinned;
  return upsertPinnedCanvasNode(canvasNodes, node.kind, node.id, nextPinned);
}

export function setCanvasEntityClassPresentationModeInCollection(
  canvasNodes: BrowserCanvasNode[],
  entityIds: string[],
  mode: BrowserClassPresentationMode,
): BrowserCanvasNode[] | null {
  if (entityIds.length === 0) {
    return null;
  }
  let changed = false;
  const targets = new Set(entityIds);
  const nextCanvasNodes = canvasNodes.map((node) => {
    if (node.kind !== 'entity' || !targets.has(node.id) || !node.classPresentation) {
      return node;
    }
    const normalized = normalizeBrowserClassPresentationPolicy(node.classPresentation);
    const nextPresentation = mode === 'compartments' && !normalized.showFields && !normalized.showFunctions
      ? {
          ...normalized,
          mode,
          showFields: true,
          showFunctions: false,
        }
      : {
          ...normalized,
          mode,
        };
    if (
      normalized.mode === nextPresentation.mode
      && normalized.showFields === nextPresentation.showFields
      && normalized.showFunctions === nextPresentation.showFunctions
    ) {
      return node;
    }
    changed = true;
    return {
      ...node,
      classPresentation: nextPresentation,
    };
  });
  return changed ? nextCanvasNodes : null;
}

export function toggleCanvasEntityClassPresentationMembersInCollection(
  canvasNodes: BrowserCanvasNode[],
  entityIds: string[],
  memberKind: 'fields' | 'functions',
): BrowserCanvasNode[] | null {
  if (entityIds.length === 0) {
    return null;
  }
  let changed = false;
  const key = memberKind === 'fields' ? 'showFields' : 'showFunctions';
  const targets = new Set(entityIds);
  const nextCanvasNodes = canvasNodes.map((node) => {
    if (node.kind !== 'entity' || !targets.has(node.id) || !node.classPresentation) {
      return node;
    }
    const normalized = normalizeBrowserClassPresentationPolicy(node.classPresentation);
    changed = true;
    return {
      ...node,
      classPresentation: {
        ...normalized,
        [key]: !normalized[key],
      },
    };
  });
  return changed ? nextCanvasNodes : null;
}
