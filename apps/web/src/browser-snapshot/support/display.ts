import type { FullSnapshotScope } from '../../app-model';
import type { BrowserSearchDocument, BrowserSearchResultKind, BrowserSnapshotIndex } from '../browserSnapshotIndex.types';

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase();
}

export function displayNameOf(item: { displayName: string | null; name: string }) {
  return item.displayName?.trim() || item.name;
}

export function compactScopeDisplayName(scope: FullSnapshotScope) {
  const raw = displayNameOf(scope);
  if ((scope.kind === 'FILE' || scope.kind === 'DIRECTORY') && raw.includes('/')) {
    const segments = raw.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? raw;
  }
  return raw;
}

export function createSearchDocument(kind: BrowserSearchResultKind, id: string, title: string, subtitle: string, scopeId: string | null, searchParts: Array<string | null | undefined>): BrowserSearchDocument {
  return { kind, id, title, subtitle, scopeId, normalizedText: normalizeSearchText(searchParts.join(' ')) };
}

export function buildSearchableDocuments(index: BrowserSnapshotIndex) {
  const scopeDocuments = index.payload.scopes.map((scope) => createSearchDocument('scope', scope.externalId, displayNameOf(scope), index.scopePathById.get(scope.externalId) ?? scope.kind, scope.externalId, [scope.externalId, scope.kind, scope.name, scope.displayName, index.scopePathById.get(scope.externalId)]));
  const entityDocuments = index.payload.entities.map((entity) => {
    const relatedRelationshipIds = [
      ...(index.inboundRelationshipIdsByEntityId.get(entity.externalId) ?? []),
      ...(index.outboundRelationshipIdsByEntityId.get(entity.externalId) ?? []),
    ];
    const relatedTerms = relatedRelationshipIds.flatMap((relationshipId) => {
      const relationship = index.relationshipsById.get(relationshipId);
      if (!relationship) return [];
      const fromEntity = index.entitiesById.get(relationship.fromEntityId);
      const toEntity = index.entitiesById.get(relationship.toEntityId);
      return [relationship.kind, relationship.label, relationship.externalId, fromEntity?.name, fromEntity?.displayName, toEntity?.name, toEntity?.displayName];
    });
    return createSearchDocument('entity', entity.externalId, displayNameOf(entity), [entity.kind, entity.scopeId ? index.scopePathById.get(entity.scopeId) : null].filter(Boolean).join(' • '), entity.scopeId, [entity.externalId, entity.kind, entity.origin, entity.name, entity.displayName, entity.scopeId ? index.scopePathById.get(entity.scopeId) : null, ...relatedTerms]);
  });
  const relationshipDocuments = index.payload.relationships.map((relationship) => {
    const fromEntity = index.entitiesById.get(relationship.fromEntityId);
    const toEntity = index.entitiesById.get(relationship.toEntityId);
    const scopeId = fromEntity?.scopeId ?? toEntity?.scopeId ?? null;
    return createSearchDocument('relationship', relationship.externalId, relationship.label?.trim() || relationship.kind, [displayNameOf(fromEntity ?? { name: relationship.fromEntityId, displayName: null }), '→', displayNameOf(toEntity ?? { name: relationship.toEntityId, displayName: null })].join(' '), scopeId, [relationship.externalId, relationship.kind, relationship.label, fromEntity?.name, fromEntity?.displayName, toEntity?.name, toEntity?.displayName]);
  });
  const diagnosticDocuments = index.payload.diagnostics.map((diagnostic) => createSearchDocument('diagnostic', diagnostic.externalId, `${diagnostic.severity}: ${diagnostic.code}`, diagnostic.message, diagnostic.scopeId ?? index.entitiesById.get(diagnostic.entityId ?? '')?.scopeId ?? null, [diagnostic.externalId, diagnostic.severity, diagnostic.phase, diagnostic.code, diagnostic.message, diagnostic.filePath]));
  return [...scopeDocuments, ...entityDocuments, ...relationshipDocuments, ...diagnosticDocuments];
}
