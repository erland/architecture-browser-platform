import type { BrowserFactsPanelLocation, BrowserFactsPanelMode } from '../../browser-session/types';
import {
  getContainedEntitiesForEntity,
  getContainingEntitiesForEntity,
  getDirectEntitiesForScopeByKind,
  getPrimaryEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
  type BrowserSnapshotIndex,
} from '../../browser-snapshot';

export type BrowserFocusPorts = {
  addEntitiesToCanvas: (entityIds: string[]) => void;
  selectScope: (scopeId: string | null) => void;
  focusElement: (focusedElement: { kind: 'scope' | 'entity' | 'relationship'; id: string } | null) => void;
  openFactsPanel: (mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation) => void;
  setActiveTab: (tab: 'layout' | 'search' | 'dependencies') => void;
};

export type BrowserScopeAnalysisMode = 'primary' | 'direct' | 'subtree' | 'children-primary';

export function focusCanvasEntitiesWorkflow(
  ports: BrowserFocusPorts,
  entityIds: string[],
  fallbackScopeId?: string,
) {
  const trimmedEntityIds = [...new Set(entityIds)].slice(0, 24);
  ports.addEntitiesToCanvas(trimmedEntityIds);
  if (fallbackScopeId) {
    ports.selectScope(fallbackScopeId);
  }
  if (trimmedEntityIds[0]) {
    ports.focusElement({ kind: 'entity', id: trimmedEntityIds[0] });
    ports.openFactsPanel('entity', 'right');
  } else if (fallbackScopeId) {
    ports.focusElement({ kind: 'scope', id: fallbackScopeId });
    ports.openFactsPanel('scope', 'right');
  }
  ports.setActiveTab('layout');
}

export function runScopeAnalysisWorkflow(
  index: BrowserSnapshotIndex | null,
  ports: BrowserFocusPorts,
  scopeId: string,
  mode: BrowserScopeAnalysisMode,
  kinds?: string[],
  childScopeKinds?: string[],
) {
  if (!index) {
    return;
  }

  let entityIds: string[] = [];
  if (mode === 'primary') {
    entityIds = getPrimaryEntitiesForScope(index, scopeId).map((entity) => entity.externalId);
  } else if (mode === 'direct') {
    entityIds = getDirectEntitiesForScopeByKind(index, scopeId, kinds).map((entity) => entity.externalId);
  } else if (mode === 'subtree') {
    entityIds = getSubtreeEntitiesForScopeByKind(index, scopeId, kinds).map((entity) => entity.externalId);
  } else {
    const allowedChildKinds = childScopeKinds && childScopeKinds.length > 0 ? new Set(childScopeKinds) : null;
    const childScopeIds = (index.childScopeIdsByParentId.get(scopeId) ?? []).filter((childScopeId) => {
      if (!allowedChildKinds) {
        return true;
      }
      return allowedChildKinds.has(index.scopesById.get(childScopeId)?.kind ?? '');
    });
    const collected = childScopeIds.flatMap((childScopeId) => getPrimaryEntitiesForScope(index, childScopeId).map((entity) => entity.externalId));
    entityIds = kinds && kinds.length > 0
      ? collected.filter((entityId) => kinds.includes(index.entitiesById.get(entityId)?.kind ?? ''))
      : collected;
  }

  focusCanvasEntitiesWorkflow(ports, entityIds, scopeId);
}

export function runContainedEntitiesWorkflow(
  index: BrowserSnapshotIndex | null,
  ports: BrowserFocusPorts,
  entityId: string,
  kinds?: string[],
) {
  if (!index) {
    return;
  }
  const entityIds = getContainedEntitiesForEntity(index, entityId)
    .filter((entity) => !kinds || kinds.includes(entity.kind))
    .map((entity) => entity.externalId);
  const fallbackScopeId = index.entitiesById.get(entityId)?.scopeId ?? undefined;
  focusCanvasEntitiesWorkflow(ports, entityIds, fallbackScopeId);
}

export function runPeerEntitiesWorkflow(
  index: BrowserSnapshotIndex | null,
  ports: BrowserFocusPorts,
  entityId: string,
  containerKinds?: string[],
  peerKinds?: string[],
) {
  if (!index) {
    return;
  }
  const allowedContainerKinds = containerKinds && containerKinds.length > 0 ? new Set(containerKinds) : null;
  const containers = getContainingEntitiesForEntity(index, entityId).filter((entity) => !allowedContainerKinds || allowedContainerKinds.has(entity.kind));
  const peerIds = new Set<string>();
  for (const container of containers) {
    for (const peer of getContainedEntitiesForEntity(index, container.externalId)) {
      if (peer.externalId === entityId) {
        continue;
      }
      if (peerKinds && peerKinds.length > 0 && !peerKinds.includes(peer.kind)) {
        continue;
      }
      peerIds.add(peer.externalId);
    }
  }
  const fallbackScopeId = index.entitiesById.get(entityId)?.scopeId ?? undefined;
  focusCanvasEntitiesWorkflow(ports, [...peerIds], fallbackScopeId);
}
