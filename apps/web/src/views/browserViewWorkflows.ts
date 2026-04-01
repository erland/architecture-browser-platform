import type { BrowserFactsPanelLocation, BrowserFactsPanelMode } from '../browserSessionStore';
import {
  getContainedEntitiesForEntity,
  getContainingEntitiesForEntity,
  getDirectEntitiesForScopeByKind,
  getPrimaryEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
  type BrowserSnapshotIndex,
} from '../browserSnapshotIndex';
import type { BrowserTopSearchResultAction } from '../components/BrowserTopSearch';

export type BrowserFocusPorts = {
  addEntitiesToCanvas: (entityIds: string[]) => void;
  selectScope: (scopeId: string | null) => void;
  focusElement: (focusedElement: { kind: 'scope' | 'entity' | 'relationship'; id: string } | null) => void;
  openFactsPanel: (mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation) => void;
  setActiveTab: (tab: 'layout' | 'search' | 'dependencies') => void;
};

export type BrowserScopeAnalysisMode = 'primary' | 'direct' | 'subtree' | 'children-primary';

export function focusCanvasEntitiesCommand(
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

export function runScopeAnalysisCommand(
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

  focusCanvasEntitiesCommand(ports, entityIds, scopeId);
}

export function runContainedEntitiesCommand(
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
  focusCanvasEntitiesCommand(ports, entityIds, fallbackScopeId);
}

export function runPeerEntitiesCommand(
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
  focusCanvasEntitiesCommand(ports, [...peerIds], fallbackScopeId);
}

export type BrowserTopSearchPorts = BrowserFocusPorts & {
  addEntityToCanvas: (entityId: string) => void;
  addPrimaryScopeEntitiesToCanvas: (scopeId: string) => void;
};

export function runTopSearchActionCommand(
  ports: BrowserTopSearchPorts,
  action: BrowserTopSearchResultAction,
) {
  const targetScopeId = action.kind === 'scope' ? action.id : action.scopeId;
  if (targetScopeId) {
    ports.selectScope(targetScopeId);
  }
  if (action.type === 'select-scope') {
    ports.focusElement({ kind: 'scope', id: action.id });
    ports.openFactsPanel('scope', 'right');
    ports.setActiveTab('layout');
    return;
  }
  if (action.type === 'add-scope-primary-entities') {
    ports.addPrimaryScopeEntitiesToCanvas(action.id);
    return;
  }
  if (action.type === 'open-entity') {
    ports.addEntityToCanvas(action.id);
    ports.focusElement({ kind: 'entity', id: action.id });
    ports.openFactsPanel('entity', 'right');
    ports.setActiveTab('search');
    return;
  }
  if (action.type === 'open-relationship') {
    ports.focusElement({ kind: 'relationship', id: action.id });
    ports.openFactsPanel('relationship', 'right');
    ports.setActiveTab('dependencies');
    return;
  }
  ports.focusElement(null);
  ports.openFactsPanel('hidden', 'right');
  ports.setActiveTab('search');
}
