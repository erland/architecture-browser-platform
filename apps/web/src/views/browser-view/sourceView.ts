import type { FullSnapshotEntity, FullSnapshotPayload, FullSnapshotRelationship, FullSnapshotScope, SnapshotSourceRef } from '../../app-model/appModel.snapshot';
import type { BrowserSessionState } from '../../browser-session/types';
import type { SnapshotSourceFileReadRequest, SourceViewReadResponse } from '../../app-model';
import { platformApi } from '../../api';


function normalizePath(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
    return null;
  }
  return normalized;
}

function firstReadableSourceRef(sourceRefs: SnapshotSourceRef[] | null | undefined): SnapshotSourceRef | null {
  if (!sourceRefs) {
    return null;
  }
  for (const sourceRef of sourceRefs) {
    if (normalizePath(sourceRef.path)) {
      return sourceRef;
    }
  }
  return null;
}

function getSelectionSourceRef(payload: FullSnapshotPayload, state: BrowserSessionState): SnapshotSourceRef | null {
  if (state.focusedElement?.kind === 'scope') {
    const scope = payload.scopes.find((item: FullSnapshotScope) => item.externalId === state.focusedElement?.id);
    return firstReadableSourceRef(scope?.sourceRefs);
  }
  if (state.focusedElement?.kind === 'entity') {
    const entity = payload.entities.find((item: FullSnapshotEntity) => item.externalId === state.focusedElement?.id);
    return firstReadableSourceRef(entity?.sourceRefs);
  }
  if (state.focusedElement?.kind === 'relationship') {
    const relationship = payload.relationships.find((item: FullSnapshotRelationship) => item.externalId === state.focusedElement?.id);
    return firstReadableSourceRef(relationship?.sourceRefs);
  }
  if (state.selectedScopeId) {
    const scope = payload.scopes.find((item: FullSnapshotScope) => item.externalId === state.selectedScopeId);
    return firstReadableSourceRef(scope?.sourceRefs);
  }
  return null;
}

export function buildSelectedObjectSnapshotSourceFileRequest(state: BrowserSessionState): SnapshotSourceFileReadRequest | null {
  const snapshotId = state.activeSnapshot?.snapshotId ?? null;
  const payload = state.payload;
  if (!snapshotId || !payload) {
    return null;
  }
  const sourceRef = getSelectionSourceRef(payload, state);
  const path = normalizePath(sourceRef?.path);
  if (!path) {
    return null;
  }
  return {
    snapshotId,
    path,
    startLine: sourceRef?.startLine ?? null,
    endLine: sourceRef?.endLine ?? null,
  };
}

export async function requestSelectedObjectSourceView(workspaceId: string, state: BrowserSessionState) {
  const request = buildSelectedObjectSnapshotSourceFileRequest(state);
  if (!request) {
    throw new Error('No selected object is available for source view.');
  }
  return platformApi.readSnapshotSourceFile<SourceViewReadResponse>(workspaceId, request);
}
