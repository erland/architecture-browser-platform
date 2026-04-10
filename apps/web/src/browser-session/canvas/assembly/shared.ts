import { resolveBrowserStateViewpointPresentationPolicy } from '../../../browser-graph/presentation';
import type { BrowserCanvasNode, BrowserSessionState } from '../../model/types';
import { createCanvasEntityClassPresentationFromViewpointPolicy } from '../../../browser-graph/semantics';

export function collectValidEntityIds(state: BrowserSessionState, entityIds: string[]): string[] {
  if (!state.index) {
    return [];
  }
  return [...new Set(entityIds)].filter((entityId) => state.index?.entitiesById.has(entityId));
}

export function createEntityNodePatch(
  state: BrowserSessionState,
  entityId: string,
  options?: { pinned?: boolean },
): Pick<BrowserCanvasNode, 'kind' | 'id' | 'pinned' | 'classPresentation'> {
  const presentationPolicy = resolveBrowserStateViewpointPresentationPolicy(state);
  return {
    kind: 'entity',
    id: entityId,
    pinned: options?.pinned,
    classPresentation: createCanvasEntityClassPresentationFromViewpointPolicy(entityId, state.index, presentationPolicy),
  };
}
