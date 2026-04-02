import type {
  FullSnapshotEntity,
  FullSnapshotScope,
  SnapshotSourceRef,
} from '../../app-model';
import type { BrowserSnapshotIndex } from '../../browserSnapshotIndex';

export type SavedCanvasStableReferenceLookup = {
  scopeIdByStableKey: Map<string, string>;
  entityIdByStableKey: Map<string, string>;
  relationshipIdByStableKey: Map<string, string>;
};

export type SavedCanvasReferenceResolutionStrategy =
  | 'DIRECT_ID'
  | 'EXACT_STABLE_KEY'
  | 'FALLBACK_SCOPE_PATH'
  | 'FALLBACK_SCOPE_NAME'
  | 'FALLBACK_ENTITY_QUALIFIED_NAME'
  | 'FALLBACK_ENTITY_PATH_AND_NAME'
  | 'FALLBACK_ENTITY_NAME_IN_SCOPE'
  | 'FALLBACK_ENTITY_FINGERPRINT'
  | 'FALLBACK_RELATIONSHIP_ENDPOINTS'
  | 'UNRESOLVED';

export type SavedCanvasReferenceResolution = {
  resolvedId: string | null;
  strategy: SavedCanvasReferenceResolutionStrategy;
};

export function classifyScopeCategory(kind: string | null | undefined): string {
  const normalizedKind = normalizeToken(kind ?? 'scope');
  if (normalizedKind.includes('file')) return 'file';
  if (normalizedKind.includes('directory') || normalizedKind.includes('folder')) return 'directory';
  if (normalizedKind.includes('package') || normalizedKind.includes('namespace')) return 'package';
  if (normalizedKind.includes('module')) return 'module';
  if (normalizedKind.includes('repository') || normalizedKind.includes('workspace') || normalizedKind.includes('root')) return 'repository';
  return normalizedKind || 'scope';
}

export function classifyEntityCategory(kind: string | null | undefined): string {
  const normalizedKind = normalizeToken(kind ?? 'entity');
  if (normalizedKind.includes('endpoint') || normalizedKind.includes('route') || normalizedKind.includes('action')) return 'endpoint';
  if (normalizedKind.includes('function') || normalizedKind.includes('method') || normalizedKind.includes('handler') || normalizedKind.includes('procedure')) return 'function';
  if (normalizedKind.includes('class') || normalizedKind.includes('type') || normalizedKind.includes('interface') || normalizedKind.includes('enum') || normalizedKind.includes('record')) return 'type';
  if (normalizedKind.includes('module') || normalizedKind.includes('component') || normalizedKind.includes('service') || normalizedKind.includes('adapter')) return 'module';
  return normalizedKind || 'entity';
}

export function normalizeToken(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function deriveScopePath(index: BrowserSnapshotIndex, scope: FullSnapshotScope | null): string | null {
  if (!scope) {
    return null;
  }
  const parentScope = scope.parentScopeId ? index.scopesById.get(scope.parentScopeId) ?? null : null;
  const scopeName = scope.name || scope.displayName || scope.externalId;
  if (!parentScope) {
    return scopeName;
  }
  const parentPath = index.scopePathById.get(parentScope.externalId) ?? deriveScopePath(index, parentScope);
  return parentPath ? `${parentPath}/${scopeName}` : scopeName;
}

export function deriveEntityQualifiedName(index: BrowserSnapshotIndex, entity: FullSnapshotEntity): string | null {
  const scopePath = entity.scopeId ? index.scopePathById.get(entity.scopeId) ?? null : null;
  const name = entity.displayName ?? entity.name ?? entity.externalId;
  return scopePath ? `${scopePath}/${name}` : name;
}

export function deriveEntitySignature(entity: FullSnapshotEntity): string | null {
  return readFirstStringMetadata(entity.metadata, ['signature', 'methodSignature', 'callableSignature', 'descriptor']);
}

export function pickPrimarySourcePath(sourceRefs: SnapshotSourceRef[] | null | undefined): string | null {
  if (!sourceRefs || sourceRefs.length === 0) {
    return null;
  }
  const firstWithPath = sourceRefs.find((sourceRef) => sourceRef.path?.trim());
  return firstWithPath?.path ?? null;
}

export function readFirstStringMetadata(metadata: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  if (!metadata) {
    return null;
  }
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
