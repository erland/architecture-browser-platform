import type { FullSnapshotEntity } from '../../app-model';
import {
  getContainedEntitiesForEntity,
  getContainingEntitiesForEntity,
  getPrimaryEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
  type BrowserSnapshotIndex,
} from '../../browser-snapshot';
import type { BrowserEntitySelectionAction } from './BrowserGraphWorkspace.types';

function filterEntitiesByKinds(entities: FullSnapshotEntity[], kinds?: string[]) {
  if (!kinds || kinds.length === 0) {
    return entities;
  }
  const allowed = new Set(kinds);
  return entities.filter((entity) => allowed.has(entity.kind));
}

function getEntityContainedCount(index: BrowserSnapshotIndex, entityId: string, kinds?: string[]) {
  return filterEntitiesByKinds(getContainedEntitiesForEntity(index, entityId), kinds).length;
}

function getEntityPeerCount(index: BrowserSnapshotIndex, entityId: string, containerKinds?: string[], peerKinds?: string[]) {
  const containers = filterEntitiesByKinds(getContainingEntitiesForEntity(index, entityId), containerKinds);
  const peerIds = new Set<string>();
  for (const container of containers) {
    for (const peer of filterEntitiesByKinds(getContainedEntitiesForEntity(index, container.externalId), peerKinds)) {
      if (peer.externalId !== entityId) {
        peerIds.add(peer.externalId);
      }
    }
  }
  return peerIds.size;
}

function getScopeChildPrimaryCount(index: BrowserSnapshotIndex, scopeId: string, childScopeKinds?: string[]) {
  const childKindFilter = childScopeKinds && childScopeKinds.length > 0 ? new Set(childScopeKinds) : null;
  const childScopeIds = (index.childScopeIdsByParentId.get(scopeId) ?? []).filter((childScopeId) => {
    if (!childKindFilter) {
      return true;
    }
    return childKindFilter.has(index.scopesById.get(childScopeId)?.kind ?? '');
  });
  const entityIds = new Set<string>();
  for (const childScopeId of childScopeIds) {
    for (const entity of getPrimaryEntitiesForScope(index, childScopeId)) {
      entityIds.add(entity.externalId);
    }
  }
  return entityIds.size;
}

export function scopeActionLabel(index: BrowserSnapshotIndex | null, scopeId: string | null) {
  if (!index || !scopeId) {
    return 'selected scope';
  }
  return index.scopePathById.get(scopeId) ?? scopeId;
}

export function renderCompartmentSubtitle(kind: string) {
  return kind.toLowerCase();
}

export function buildEntitySelectionActions(index: BrowserSnapshotIndex | null, entity: FullSnapshotEntity | null): BrowserEntitySelectionAction[] {
  if (!index || !entity) {
    return [];
  }

  const containedCount = getEntityContainedCount(index, entity.externalId);
  const inboundCount = index.inboundRelationshipIdsByEntityId.get(entity.externalId)?.length ?? 0;
  const outboundCount = index.outboundRelationshipIdsByEntityId.get(entity.externalId)?.length ?? 0;
  const scopeId = entity.scopeId;

  if (entity.kind === 'MODULE') {
    const functionCount = getEntityContainedCount(index, entity.externalId, ['FUNCTION']);
    return [
      { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
      { key: 'functions', label: `Functions${functionCount > 0 ? ` (${Math.min(functionCount, 24)})` : ''}`, disabled: functionCount === 0 },
      { key: 'dependencies', label: 'Dependencies', disabled: inboundCount + outboundCount === 0 },
      { key: 'used-by', label: `Used by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  if (entity.kind === 'PACKAGE') {
    const subpackageCount = scopeId ? getScopeChildPrimaryCount(index, scopeId, ['PACKAGE']) : 0;
    const moduleCount = scopeId ? getSubtreeEntitiesForScopeByKind(index, scopeId, ['MODULE']).length : 0;
    const classCount = scopeId ? getSubtreeEntitiesForScopeByKind(index, scopeId, ['CLASS', 'INTERFACE']).length : 0;
    return [
      { key: 'subpackages', label: `Subpackages${subpackageCount > 0 ? ` (${Math.min(subpackageCount, 24)})` : ''}`, disabled: subpackageCount === 0 },
      { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
      { key: 'modules', label: `Modules${moduleCount > 0 ? ` (${Math.min(moduleCount, 24)})` : ''}`, disabled: moduleCount === 0 },
      { key: 'classes', label: `Classes${classCount > 0 ? ` (${Math.min(classCount, 24)})` : ''}`, disabled: classCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  if (entity.kind === 'FUNCTION') {
    const sameModuleCount = getEntityPeerCount(index, entity.externalId, ['MODULE'], ['FUNCTION']);
    return [
      { key: 'calls', label: `Calls${outboundCount > 0 ? ` (${Math.min(outboundCount, 24)})` : ''}`, disabled: outboundCount === 0 },
      { key: 'called-by', label: `Called by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
      { key: 'same-module', label: `Same module${sameModuleCount > 0 ? ` (${Math.min(sameModuleCount, 24)})` : ''}`, disabled: sameModuleCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  if (entity.kind === 'CLASS' || entity.kind === 'INTERFACE') {
    return [
      { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
      { key: 'dependencies', label: 'Dependencies', disabled: inboundCount + outboundCount === 0 },
      { key: 'used-by', label: `Used by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  return [
    { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
    { key: 'dependencies', label: 'Dependencies', disabled: inboundCount + outboundCount === 0 },
    { key: 'used-by', label: `Used by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
    { key: 'remove', label: 'Remove' },
    { key: 'pin', label: 'Pin' },
  ];
}
