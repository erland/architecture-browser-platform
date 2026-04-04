import type { FullSnapshotDiagnostic, FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope, SnapshotSourceRef } from '../../app-model';
import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import type { BrowserFactsPanelEntityGroup } from './BrowserFactsPanel.types';

export function uniqueSourceRefs(sourceRefs: SnapshotSourceRef[]) {
  const seen = new Set<string>();
  const unique: SnapshotSourceRef[] = [];
  for (const item of sourceRefs) {
    const key = JSON.stringify(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

export function formatRelationshipLabel(index: BrowserSnapshotIndex, relationship: FullSnapshotRelationship) {
  const fromEntity = index.entitiesById.get(relationship.fromEntityId);
  const toEntity = index.entitiesById.get(relationship.toEntityId);
  const fromName = fromEntity?.displayName?.trim() || fromEntity?.name || relationship.fromEntityId;
  const toName = toEntity?.displayName?.trim() || toEntity?.name || relationship.toEntityId;
  return `${fromName} → ${toName}`;
}

export function displayEntityName(entity: FullSnapshotEntity) {
  return entity.displayName?.trim() || entity.name;
}

export function displayScopeName(scope: FullSnapshotScope) {
  return scope.displayName?.trim() || scope.name;
}

export function renderSourceRef(sourceRef: SnapshotSourceRef, index: number) {
  const segments = [sourceRef.path, sourceRef.startLine ? `line ${sourceRef.startLine}` : null, sourceRef.endLine && sourceRef.endLine !== sourceRef.startLine ? `to ${sourceRef.endLine}` : null].filter(Boolean);
  return <li key={`${sourceRef.path ?? 'ref'}:${index}`}>{segments.join(' • ') || 'Source reference'}</li>;
}

export function renderDiagnostic(diagnostic: FullSnapshotDiagnostic) {
  return (
    <li key={diagnostic.externalId} className="browser-facts-panel__list-item">
      <strong>{diagnostic.severity}: {diagnostic.code}</strong>
      <span>{diagnostic.message}</span>
      {diagnostic.filePath ? <span className="muted">{diagnostic.filePath}</span> : null}
    </li>
  );
}

export function renderViewpointList(values: string[], emptyText: string) {
  if (values.length === 0) {
    return <p className="muted">{emptyText}</p>;
  }
  return (
    <ul className="browser-facts-panel__list">
      {values.map((value) => (
        <li key={value} className="browser-facts-panel__list-item">{value}</li>
      ))}
    </ul>
  );
}

export function renderEntityButtonLabel(group: BrowserFactsPanelEntityGroup, scope: 'direct' | 'subtree') {
  if (scope === 'direct') {
    return `Add ${group.kind.toLocaleLowerCase()}${group.count === 1 ? '' : 's'}`;
  }
  return `Add subtree ${group.kind.toLocaleLowerCase()}${group.count === 1 ? '' : 's'}`;
}


export function formatEntityKindLabel(kind: string) {
  return kind.toLocaleLowerCase().replace(/_/g, ' ');
}

export function getEntityArchitecturalRoles(entity: FullSnapshotEntity): string[] {
  const value = entity.metadata?.architecturalRoles;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

export function buildEntitySummaryHeadline(entity: FullSnapshotEntity, scopeLabel: string) {
  const name = displayEntityName(entity);
  const roles = new Set(getEntityArchitecturalRoles(entity));
  const kind = entity.kind.toUpperCase();
  if (roles.has('api-entrypoint') || kind === 'ENDPOINT' || kind === 'RESOURCE' || kind === 'CONTROLLER') {
    return `${name} is an API entrypoint in ${scopeLabel}.`;
  }
  if (roles.has('persistence-access') || kind === 'REPOSITORY' || kind === 'DATASTORE') {
    return `${name} is a persistence access ${formatEntityKindLabel(entity.kind)} in ${scopeLabel}.`;
  }
  if (kind === 'PAGE' || kind === 'ROUTE' || kind === 'LAYOUT' || kind === 'VIEW') {
    return `${name} is a UI ${formatEntityKindLabel(entity.kind)} in ${scopeLabel}.`;
  }
  if (kind === 'COMPONENT') {
    return `${name} is a UI component in ${scopeLabel}.`;
  }
  if (kind === 'CLASS') {
    return `${name} is a class in ${scopeLabel}.`;
  }
  if (kind === 'MODULE') {
    return `${name} is a module in ${scopeLabel}.`;
  }
  return `${name} is a ${formatEntityKindLabel(entity.kind)} in ${scopeLabel}.`;
}
