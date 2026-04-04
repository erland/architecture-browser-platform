import type { FullSnapshotEntity } from '../../app-model';
import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserClassPresentationMode, BrowserSessionState } from '../../browser-session';
import type { BrowserAutoLayoutMode } from '../../browser-auto-layout';
import type { BrowserEntitySelectionAction, ScopeAnalysisMode } from './BrowserGraphWorkspace.types';
import { BrowserGraphWorkspaceMenu, runMenuAction } from './BrowserGraphWorkspaceMenu';

export function BrowserGraphWorkspaceToolbarMenus({
  model,
  state,
  scopeActionScopeId,
  scopePrimaryEntityCount,
  scopeDirectEntityCount,
  scopeSubtreeEntityCount,
  selectedEntityCount,
  focusedEntity,
  focusedScopeId,
  entityActions,
  scopeChildCount,
  onAddScopeAnalysis,
  onIsolateSelection,
  onRemoveSelection,
  onSelectAllEntities,
  onArrangeAllCanvasNodes,
  onArrangeCanvasWithMode,
  onArrangeCanvasAroundFocus,
  onFitView,
  onClearCanvas,
  onSetCanvasViewport,
  onShowScopeContainer,
  onTogglePinNode,
  onSetClassPresentationMode,
  onToggleClassPresentationMembers,
  selectedClassEntityIds,
  onEntityAction,
}: {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  scopeActionScopeId: string | null;
  scopePrimaryEntityCount: number;
  scopeDirectEntityCount: number;
  scopeSubtreeEntityCount: number;
  selectedEntityCount: number;
  focusedEntity: FullSnapshotEntity | null;
  focusedScopeId: string | null;
  entityActions: BrowserEntitySelectionAction[];
  scopeChildCount: number;
  onAddScopeAnalysis: (scopeId: string, mode: ScopeAnalysisMode, kinds?: string[], childScopeKinds?: string[]) => void;
  onIsolateSelection: () => void;
  onRemoveSelection: () => void;
  onSelectAllEntities: () => void;
  onArrangeAllCanvasNodes: () => void;
  onArrangeCanvasWithMode: (mode: BrowserAutoLayoutMode) => void;
  onArrangeCanvasAroundFocus: () => void;
  onFitView: () => void;
  onClearCanvas: () => void;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
  onShowScopeContainer: (scopeId?: string) => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onSetClassPresentationMode: (entityIds: string[], mode: BrowserClassPresentationMode) => void;
  onToggleClassPresentationMembers: (entityIds: string[], memberKind: 'fields' | 'functions') => void;
  selectedClassEntityIds: string[];
  onEntityAction: (actionKey: string) => void;
}) {
  const hasFocusedEntity = Boolean(focusedEntity);
  const canAddPrimary = Boolean(scopeActionScopeId) && scopePrimaryEntityCount > 0;
  const canAddDirect = Boolean(scopeActionScopeId) && scopeDirectEntityCount > 0;
  const canAddSubtree = Boolean(scopeActionScopeId) && scopeSubtreeEntityCount > 0;
  const canOpenAddMenu = canAddPrimary || canAddDirect || canAddSubtree;
  const canArrangeAll = model.nodes.length > 0;
  const canArrangeAroundFocus = model.nodes.length > 0 && hasFocusedEntity;
  const canOpenArrangeMenu = canArrangeAll || canArrangeAroundFocus;
  const canIsolateOrRemove = selectedEntityCount > 0 || Boolean(focusedScopeId);
  const canOpenEntityAction = hasFocusedEntity && entityActions.some((action) => !action.disabled || action.key === 'pin');
  const canAddChildPrimary = Boolean(focusedScopeId) && scopeChildCount > 0;
  const canAddFocusedDirect = Boolean(focusedScopeId) && scopeDirectEntityCount > 0;
  const canAddFocusedSubtree = Boolean(focusedScopeId) && scopeSubtreeEntityCount > 0;
  const canOpenAdvancedScopeMenu = Boolean(focusedScopeId);
  const canOpenClassPresentationMenu = selectedClassEntityIds.length > 0;
  const selectedClassNodes = state.canvasNodes.filter((node) => node.kind === 'entity' && selectedClassEntityIds.includes(node.id) && node.classPresentation);
  const classPresentationState = selectedClassEntityIds.length === 1
    ? selectedClassNodes[0]?.classPresentation ?? null
    : null;
  const allSelectedClassesAreSimple = selectedClassNodes.length > 0 && selectedClassNodes.every((node) => node.classPresentation?.mode === 'simple');
  const allSelectedClassesAreCompartments = selectedClassNodes.length > 0 && selectedClassNodes.every((node) => node.classPresentation?.mode === 'compartments');
  const showMemberToggleActions = selectedClassEntityIds.length > 1 || !classPresentationState || classPresentationState.mode === 'compartments';
  const hasSelectableCanvasEntities = state.canvasNodes.some((node) => node.kind === 'entity');
  const canOpenSelectionMenu = hasSelectableCanvasEntities || canIsolateOrRemove || canOpenEntityAction || Boolean(focusedScopeId) || canOpenClassPresentationMenu;
  const showSimpleClassAction = !allSelectedClassesAreSimple;
  const showCompartmentsClassAction = !allSelectedClassesAreCompartments;

  return (
    <>
      <BrowserGraphWorkspaceMenu label="Add" enabled={canOpenAddMenu}>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => { if (scopeActionScopeId) onAddScopeAnalysis(scopeActionScopeId, 'primary'); })} disabled={!canAddPrimary}>Primary entities</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => { if (scopeActionScopeId) onAddScopeAnalysis(scopeActionScopeId, 'direct'); })} disabled={!canAddDirect}>Direct entities</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => { if (scopeActionScopeId) onAddScopeAnalysis(scopeActionScopeId, 'subtree'); })} disabled={!canAddSubtree}>Subtree entities</button>
      </BrowserGraphWorkspaceMenu>

      <BrowserGraphWorkspaceMenu label="Arrange" enabled={canOpenArrangeMenu}>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onArrangeAllCanvasNodes)} disabled={!canArrangeAll}>Arrange all (Structure)</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onArrangeCanvasWithMode('balanced'))} disabled={!canArrangeAll}>Balanced layout</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onArrangeCanvasWithMode('flow'))} disabled={!canArrangeAll}>Flow layout</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onArrangeCanvasWithMode('hierarchy'))} disabled={!canArrangeAll}>Hierarchy layout</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onArrangeCanvasAroundFocus)} disabled={!canArrangeAroundFocus}>Arrange around focus</button>
      </BrowserGraphWorkspaceMenu>

      <BrowserGraphWorkspaceMenu label="Selection" enabled={canOpenSelectionMenu}>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onSelectAllEntities)} disabled={!hasSelectableCanvasEntities}>Select all</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onIsolateSelection)} disabled={!canIsolateOrRemove}>Isolate</button>
        <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onRemoveSelection)} disabled={!canIsolateOrRemove}>Remove</button>
        {focusedEntity ? (
          <>
            {entityActions.map((action) => {
              if (action.key === 'pin') {
                const isPinned = state.canvasNodes.find((node) => node.kind === 'entity' && node.id === focusedEntity.externalId)?.pinned;
                return (
                  <button key={action.key} type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onEntityAction(action.key))}>
                    {isPinned ? 'Unpin' : 'Pin'}
                  </button>
                );
              }
              return (
                <button key={action.key} type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onEntityAction(action.key))} disabled={action.disabled}>
                  {action.label}
                </button>
              );
            })}
            {canOpenClassPresentationMenu ? (
              <BrowserGraphWorkspaceMenu label="Class presentation" enabled inline>
                {showSimpleClassAction ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onSetClassPresentationMode(selectedClassEntityIds, 'simple'))}>Simple</button> : null}
                {showCompartmentsClassAction ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onSetClassPresentationMode(selectedClassEntityIds, 'compartments'))}>Compartments</button> : null}
                {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onToggleClassPresentationMembers(selectedClassEntityIds, 'fields'))}>
                  {classPresentationState && selectedClassEntityIds.length === 1 ? (classPresentationState.showFields ? 'Hide fields' : 'Show fields') : 'Toggle fields'}
                </button> : null}
                {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onToggleClassPresentationMembers(selectedClassEntityIds, 'functions'))}>
                  {classPresentationState && selectedClassEntityIds.length === 1 ? (classPresentationState.showFunctions ? 'Hide functions' : 'Show functions') : 'Toggle functions'}
                </button> : null}
              </BrowserGraphWorkspaceMenu>
            ) : null}
          </>
        ) : focusedScopeId ? (
          <>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onAddScopeAnalysis(focusedScopeId, 'children-primary'))} disabled={!canAddChildPrimary}>Child primary</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onAddScopeAnalysis(focusedScopeId, 'direct'))} disabled={!canAddFocusedDirect}>Direct entities</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onAddScopeAnalysis(focusedScopeId, 'subtree'))} disabled={!canAddFocusedSubtree}>Subtree entities</button>
            <BrowserGraphWorkspaceMenu label="Advanced scope node" enabled={canOpenAdvancedScopeMenu} inline>
              <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onShowScopeContainer(focusedScopeId))}>Show selected scope as container</button>
              <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onTogglePinNode({ kind: 'scope', id: focusedScopeId }))}>
                {state.canvasNodes.find((node) => node.kind === 'scope' && node.id === focusedScopeId)?.pinned ? 'Unpin container' : 'Pin container'}
              </button>
            </BrowserGraphWorkspaceMenu>
            {canOpenClassPresentationMenu ? (
              <BrowserGraphWorkspaceMenu label="Class presentation" enabled inline>
                {showSimpleClassAction ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onSetClassPresentationMode(selectedClassEntityIds, 'simple'))}>Simple</button> : null}
                {showCompartmentsClassAction ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onSetClassPresentationMode(selectedClassEntityIds, 'compartments'))}>Compartments</button> : null}
                {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onToggleClassPresentationMembers(selectedClassEntityIds, 'fields'))}>
                  {classPresentationState && selectedClassEntityIds.length === 1 ? (classPresentationState.showFields ? 'Hide fields' : 'Show fields') : 'Toggle fields'}
                </button> : null}
                {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onToggleClassPresentationMembers(selectedClassEntityIds, 'functions'))}>
                  {classPresentationState && selectedClassEntityIds.length === 1 ? (classPresentationState.showFunctions ? 'Hide functions' : 'Show functions') : 'Toggle functions'}
                </button> : null}
              </BrowserGraphWorkspaceMenu>
            ) : null}
          </>
        ) : canOpenClassPresentationMenu ? (
          <BrowserGraphWorkspaceMenu label="Class presentation" enabled inline>
            {showSimpleClassAction ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onSetClassPresentationMode(selectedClassEntityIds, 'simple'))}>Simple</button> : null}
            {showCompartmentsClassAction ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onSetClassPresentationMode(selectedClassEntityIds, 'compartments'))}>Compartments</button> : null}
            {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onToggleClassPresentationMembers(selectedClassEntityIds, 'fields'))}>
              {classPresentationState && selectedClassEntityIds.length === 1 ? (classPresentationState.showFields ? 'Hide fields' : 'Show fields') : 'Toggle fields'}
            </button> : null}
            {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onToggleClassPresentationMembers(selectedClassEntityIds, 'functions'))}>
              {classPresentationState && selectedClassEntityIds.length === 1 ? (classPresentationState.showFunctions ? 'Hide functions' : 'Show functions') : 'Toggle functions'}
            </button> : null}
          </BrowserGraphWorkspaceMenu>
        ) : (
          <>
            <button type="button" className="button-secondary" disabled>Isolate</button>
            <button type="button" className="button-secondary" disabled>Remove</button>
            <button type="button" className="button-secondary" disabled>Pin</button>
            <span className="muted browser-canvas__menu-empty">Focus an entity or scope for more actions.</span>
          </>
        )}
      </BrowserGraphWorkspaceMenu>

      <button type="button" className="button-secondary" onClick={onClearCanvas} disabled={model.nodes.length === 0}>Clear</button>

      <div className="browser-canvas__viewport-tools">
        <button type="button" className="button-secondary" onClick={onFitView} disabled={model.nodes.length === 0}>Fit view</button>
        <label className="browser-canvas__zoom browser-canvas__zoom--compact" aria-label={`Zoom ${Math.round(state.canvasViewport.zoom * 100)}%`}>
          <span className="sr-only">Zoom</span>
          <input type="range" min="35" max="220" step="5" value={Math.round(state.canvasViewport.zoom * 100)} onChange={(event) => onSetCanvasViewport({ zoom: Number(event.target.value) / 100 })} />
          <span className="sr-only">{Math.round(state.canvasViewport.zoom * 100)}%</span>
        </label>
      </div>
    </>
  );
}
