import { getPrimaryEntitiesForScope } from "../../browser-snapshot";
import type { FullSnapshotEntity } from "../../app-model";
import type { BrowserSessionState } from '../../browser-graph/contracts';

export type BrowserGraphWorkspaceSummary = {
  focusedEntity: FullSnapshotEntity | null;
  focusedEntityId: string | null;
  focusedScopeId: string | null;
  scopeActionScopeId: string | null;
  scopeChildCount: number;
  scopeDirectEntityCount: number;
  scopePrimaryEntityCount: number;
  scopeSubtreeEntityCount: number;
  selectedEntityCount: number;
  pinnedNodeCount: number;
};

/**
 * Workspace-stage summary builder for renderer consumers.
 *
 * This keeps common graph-rendering reads of session + snapshot state behind the
 * workspace stage, so renderer components do not need to hop directly into the
 * snapshot query stage for routine workspace metrics.
 */
export function buildBrowserGraphWorkspaceSummary(state: BrowserSessionState): BrowserGraphWorkspaceSummary {
  const focusedEntityId = state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null;
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;
  const scopeActionScopeId = focusedScopeId ?? state.selectedScopeId;
  const scopeTreeNode = scopeActionScopeId ? state.index?.scopeTree.find((node) => node.scopeId === scopeActionScopeId) ?? null : null;

  return {
    focusedEntityId,
    focusedScopeId,
    scopeActionScopeId,
    scopeChildCount: scopeActionScopeId ? (state.index?.childScopeIdsByParentId.get(scopeActionScopeId)?.length ?? 0) : 0,
    scopeDirectEntityCount: scopeActionScopeId ? (state.index?.entityIdsByScopeId.get(scopeActionScopeId)?.length ?? 0) : 0,
    scopePrimaryEntityCount: scopeActionScopeId ? (state.index ? getPrimaryEntitiesForScope(state.index, scopeActionScopeId).length : 0) : 0,
    scopeSubtreeEntityCount: scopeTreeNode?.descendantEntityCount ?? 0,
    selectedEntityCount: state.selectedEntityIds.length,
    pinnedNodeCount: state.canvasNodes.filter((node) => node.pinned).length,
    focusedEntity: focusedEntityId ? state.index?.entitiesById.get(focusedEntityId) ?? null : null,
  };
}
