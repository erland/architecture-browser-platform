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
