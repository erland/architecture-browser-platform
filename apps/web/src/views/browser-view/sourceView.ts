import type { BrowserSessionState } from '../../browser-session';
import type { SourceViewReadRequest, SourceViewReadResponse, SourceViewSelectedObjectType } from '../../app-model';
import { platformApi } from '../../api';

function mapFocusedElementKind(kind: 'scope' | 'entity' | 'relationship'): SourceViewSelectedObjectType {
  if (kind === 'scope') {
    return 'SCOPE';
  }
  if (kind === 'entity') {
    return 'ENTITY';
  }
  return 'RELATIONSHIP';
}

export function buildSelectedObjectSourceViewRequest(state: BrowserSessionState): SourceViewReadRequest | null {
  const snapshotId = state.activeSnapshot?.snapshotId ?? null;
  if (!snapshotId) {
    return null;
  }
  if (state.focusedElement) {
    return {
      snapshotId,
      selectedObjectType: mapFocusedElementKind(state.focusedElement.kind),
      selectedObjectId: state.focusedElement.id,
    };
  }
  if (state.selectedScopeId) {
    return {
      snapshotId,
      selectedObjectType: 'SCOPE',
      selectedObjectId: state.selectedScopeId,
    };
  }
  return null;
}

export async function requestSelectedObjectSourceView(workspaceId: string, state: BrowserSessionState) {
  const request = buildSelectedObjectSourceViewRequest(state);
  if (!request) {
    throw new Error('No selected object is available for source view.');
  }
  return platformApi.readSourceView<SourceViewReadResponse>(workspaceId, request);
}
