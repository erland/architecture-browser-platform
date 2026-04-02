import { useMemo } from 'react';
import { buildBrowserGraphWorkspaceModel, buildBrowserGraphWorkspaceSummary } from '../../browser-graph/workspace';
import { buildEntitySelectionActions } from './BrowserGraphWorkspace.actions';
import { BrowserGraphWorkspaceCanvas, BrowserGraphWorkspaceToolbar } from './BrowserGraphWorkspace.sections';
import type { BrowserGraphWorkspaceProps } from './BrowserGraphWorkspace.types';
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

  const { viewportRef, suppressClickRef, beginNodeDrag, beginViewportPan, handleViewportWheel } = useBrowserGraphWorkspaceInteractions({
    state,
    modelSize: { width: model.width, height: model.height, nodeCount: model.nodes.length },
    onMoveCanvasNode,
    onSetCanvasViewport,
  });

  const handleEntityAction = (actionKey: string) => {
    if (!focusedEntity) {
      return;
    }
    if (actionKey === 'contained') {
      onAddContainedEntities(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'functions') {
      onAddContainedEntities(focusedEntity.externalId, ['FUNCTION']);
      return;
    }
    if (actionKey === 'dependencies') {
      onExpandEntityDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'used-by' || actionKey === 'called-by') {
      onExpandInboundDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'calls') {
      onExpandOutboundDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'same-module') {
      onAddPeerEntities(focusedEntity.externalId, ['MODULE'], ['FUNCTION']);
      return;
    }
    if (actionKey === 'subpackages' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'children-primary', undefined, ['PACKAGE']);
      return;
    }
    if (actionKey === 'modules' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'subtree', ['MODULE']);
      return;
    }
    if (actionKey === 'classes' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'subtree', ['CLASS', 'INTERFACE']);
      return;
    }
    if (actionKey === 'remove') {
      onRemoveEntity(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'pin') {
      onTogglePinNode({ kind: 'entity', id: focusedEntity.externalId });
    }
  };

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
        onEntityAction={handleEntityAction}
      />
      <BrowserGraphWorkspaceCanvas
        model={model}
        state={state}
        focusedEntity={focusedEntity}
        onReconcileCanvasNodePositions={onReconcileCanvasNodePositions}
        viewportHandlers={{ beginNodeDrag, beginViewportPan, handleViewportWheel }}
        suppressClickRef={suppressClickRef}
        viewportRef={viewportRef}
        onFocusRelationship={onFocusRelationship}
        onFocusScope={onFocusScope}
        onFocusEntity={onFocusEntity}
        onSelectEntity={onSelectEntity}
      />
    </section>
  );
}
