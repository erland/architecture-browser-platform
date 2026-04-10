import { useEffect, useRef } from 'react';
import type { FullSnapshotEntity } from '../../app-model';
import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserAutoLayoutMode } from '../../browser-auto-layout';
import type { BrowserClassPresentationMode } from '../../browser-session/canvas-types';
import type { BrowserSessionState } from '../../browser-session/session-state-types';
import type { BrowserEntitySelectionAction, ScopeAnalysisMode } from './BrowserGraphWorkspace.types';
import { closeOpenMenus } from './BrowserGraphWorkspaceMenu';
import { BrowserGraphWorkspaceToolbarHeader } from './BrowserGraphWorkspaceToolbarHeader';
import { BrowserGraphWorkspaceToolbarMenus } from './BrowserGraphWorkspaceToolbarMenus';

export type BrowserGraphWorkspaceToolbarProps = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  activeModeLabel: string;
  scopeActionScopeId: string | null;
  scopePrimaryEntityCount: number;
  scopeDirectEntityCount: number;
  scopeSubtreeEntityCount: number;
  selectedEntityCount: number;
  pinnedNodeCount: number;
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
  onSetRelationshipRoutingMode: (mode: 'orthogonal' | 'straight') => void;
  onClearCanvas: () => void;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
  onShowScopeContainer: (scopeId?: string) => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onSetClassPresentationMode: (entityIds: string[], mode: BrowserClassPresentationMode) => void;
  onToggleClassPresentationMembers: (entityIds: string[], memberKind: 'fields' | 'functions') => void;
  selectedClassEntityIds: string[];
  onEntityAction: (actionKey: string) => void;
};

export function BrowserGraphWorkspaceToolbar(props: BrowserGraphWorkspaceToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const toolbar = toolbarRef.current;
      if (!toolbar || toolbar.contains(event.target as Node | null)) {
        return;
      }
      closeOpenMenus(toolbar);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <>
      <BrowserGraphWorkspaceToolbarHeader
        model={props.model}
        activeModeLabel={props.activeModeLabel}
        selectedEntityCount={props.selectedEntityCount}
        pinnedNodeCount={props.pinnedNodeCount}
      />
      <div ref={toolbarRef} className="browser-canvas__toolbar browser-canvas__toolbar--compact">
        <BrowserGraphWorkspaceToolbarMenus {...props} />
      </div>
    </>
  );
}
