import { useMemo } from 'react';
import { resolveCanvasClassPresentationTargetEntityIds } from '../../browser-session/model/classPresentation';
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
  onClearSelection = () => {},
  onSelectAllEntities = () => {},
  onIsolateSelection,
  onTogglePinNode,
  onSetClassPresentationMode = () => {},
  onToggleClassPresentationMembers = () => {},
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
  onSetRelationshipRoutingMode = () => {},
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
  const selectedClassEntityIds = useMemo(() => resolveCanvasClassPresentationTargetEntityIds(state), [state]);

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
    onSetClassPresentationMode,
    onToggleClassPresentationMembers,
    selectedClassEntityIds,
  });

  const { viewportRef, suppressClickRef, beginNodeDrag, beginViewportPan, handleViewportWheel } = useBrowserGraphWorkspaceInteractions({
    state,
    modelSize: { width: model.width, height: model.height, nodeCount: model.nodes.length },
    onMoveCanvasNode,
    onSetCanvasViewport,
  });

  const hasCanvasEntities = state.canvasNodes.some((node) => node.kind === 'entity');

  return (
    <section
      className="card browser-canvas"
      aria-label="Canvas graph workspace"
      onKeyDownCapture={(event) => {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedEntityCount > 0 || Boolean(focusedScopeId))) {
          event.preventDefault();
          onRemoveSelection();
          return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a' && hasCanvasEntities) {
          event.preventDefault();
          onSelectAllEntities();
        }
      }}
    >
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
        onSelectAllEntities={onSelectAllEntities}
        onRemoveSelection={onRemoveSelection}
        onArrangeAllCanvasNodes={onArrangeAllCanvasNodes}
        onArrangeCanvasWithMode={onArrangeCanvasWithMode}
        onArrangeCanvasAroundFocus={onArrangeCanvasAroundFocus}
        onFitView={onFitView}
        onSetRelationshipRoutingMode={onSetRelationshipRoutingMode}
        onClearCanvas={onClearCanvas}
        onSetCanvasViewport={onSetCanvasViewport}
        onShowScopeContainer={onShowScopeContainer}
        onTogglePinNode={onTogglePinNode}
        onSetClassPresentationMode={onSetClassPresentationMode}
        onToggleClassPresentationMembers={onToggleClassPresentationMembers}
        selectedClassEntityIds={selectedClassEntityIds}
        onEntityAction={interactionHandlers.onEntityAction}
      />
      <BrowserGraphWorkspaceCanvas
        model={model}
        state={state}
        onReconcileCanvasNodePositions={onReconcileCanvasNodePositions}
        onClearSelection={onClearSelection}
        viewportHandlers={{ beginNodeDrag, beginViewportPan, handleViewportWheel }}
        suppressClickRef={suppressClickRef}
        viewportRef={viewportRef}
        interactionHandlers={interactionHandlers}
        onReceiveTreeEntitiesDrop={onReceiveTreeEntitiesDrop}
      />
    </section>
  );
}
