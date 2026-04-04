import { useMemo } from 'react';
import { buildBrowserGraphWorkspaceModel, buildBrowserGraphWorkspaceSummary } from '../../browser-graph/workspace';
import { buildEntitySelectionActions } from './BrowserGraphWorkspace.actions';
import { BrowserGraphWorkspaceCanvas, BrowserGraphWorkspaceToolbar } from './BrowserGraphWorkspace.sections';
import type { BrowserGraphWorkspaceProps } from './BrowserGraphWorkspace.types';
import { useBrowserGraphWorkspaceActionHandlers } from './useBrowserGraphWorkspaceActionHandlers';
import { useBrowserGraphWorkspaceInteractions } from './useBrowserGraphWorkspaceInteractions';

export { buildEntitySelectionActions } from './BrowserGraphWorkspace.actions';
export type { BrowserGraphWorkspaceProps, ScopeAnalysisMode } from './BrowserGraphWorkspace.types';

export function BrowserGraphWorkspace({
  state,
  activeModeLabel,
  onShowScopeContainer,
  onAddScopeAnalysis,
  onAddContainedEntities,
  onAddPeerEntities,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
  onFocusRelationship,
  onExpandEntityDependencies,
  onExpandInboundDependencies,
  onExpandOutboundDependencies,
  onRemoveEntity,
  onRemoveSelection,
  onIsolateSelection,
  onTogglePinNode,
  onMoveCanvasNode,
  onReconcileCanvasNodePositions,
  onSetCanvasViewport,
  onArrangeAllCanvasNodes,
  onArrangeCanvasWithMode = () => {
    onArrangeAllCanvasNodes();
  },
  onArrangeCanvasAroundFocus,
  onClearCanvas,
  onFitView,
  onReceiveTreeEntitiesDrop,
}: BrowserGraphWorkspaceProps) {
  const model = useMemo(() => buildBrowserGraphWorkspaceModel(state), [state]);
  const {
    focusedEntity,
    focusedScopeId,
    scopeActionScopeId,
    scopeChildCount,
    scopeDirectEntityCount,
    scopePrimaryEntityCount,
    scopeSubtreeEntityCount,
    selectedEntityCount,
    pinnedNodeCount,
  } = useMemo(() => buildBrowserGraphWorkspaceSummary(state), [state]);
  const entityActions = useMemo(() => buildEntitySelectionActions(state.index, focusedEntity), [state.index, focusedEntity]);

  const interactionHandlers = useBrowserGraphWorkspaceActionHandlers({
    focusedEntity,
    onAddScopeAnalysis,
    onAddContainedEntities,
    onAddPeerEntities,
    onFocusScope,
    onFocusEntity,
    onSelectEntity,
    onFocusRelationship,
    onExpandEntityDependencies,
    onExpandInboundDependencies,
    onExpandOutboundDependencies,
    onRemoveEntity,
    onTogglePinNode,
  });

  const { viewportRef, suppressClickRef, beginNodeDrag, beginViewportPan, handleViewportWheel } = useBrowserGraphWorkspaceInteractions({
    state,
    modelSize: { width: model.width, height: model.height, nodeCount: model.nodes.length },
    onMoveCanvasNode,
    onSetCanvasViewport,
  });

  return (
    <section className="card browser-canvas" aria-label="Canvas graph workspace">
      <BrowserGraphWorkspaceToolbar
        model={model}
        state={state}
        activeModeLabel={activeModeLabel}
        scopeActionScopeId={scopeActionScopeId}
        scopePrimaryEntityCount={scopePrimaryEntityCount}
        scopeDirectEntityCount={scopeDirectEntityCount}
        scopeSubtreeEntityCount={scopeSubtreeEntityCount}
        selectedEntityCount={selectedEntityCount}
        pinnedNodeCount={pinnedNodeCount}
        focusedEntity={focusedEntity}
        focusedScopeId={focusedScopeId}
        entityActions={entityActions}
        scopeChildCount={scopeChildCount}
        onAddScopeAnalysis={onAddScopeAnalysis}
        onIsolateSelection={onIsolateSelection}
        onRemoveSelection={onRemoveSelection}
        onArrangeAllCanvasNodes={onArrangeAllCanvasNodes}
        onArrangeCanvasWithMode={onArrangeCanvasWithMode}
        onArrangeCanvasAroundFocus={onArrangeCanvasAroundFocus}
        onFitView={onFitView}
        onClearCanvas={onClearCanvas}
        onSetCanvasViewport={onSetCanvasViewport}
        onShowScopeContainer={onShowScopeContainer}
        onTogglePinNode={onTogglePinNode}
        onEntityAction={interactionHandlers.onEntityAction}
      />
      <BrowserGraphWorkspaceCanvas
        model={model}
        state={state}
        onReconcileCanvasNodePositions={onReconcileCanvasNodePositions}
        viewportHandlers={{ beginNodeDrag, beginViewportPan, handleViewportWheel }}
        suppressClickRef={suppressClickRef}
        viewportRef={viewportRef}
        interactionHandlers={interactionHandlers}
        onReceiveTreeEntitiesDrop={onReceiveTreeEntitiesDrop}
      />
    </section>
  );
}
