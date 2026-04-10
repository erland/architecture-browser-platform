import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';
import type { BrowserCanvasNode, BrowserClassPresentationMode, BrowserSessionState } from '../../browser-session/types';
import type { BrowserAutoLayoutMode } from '../../browser-auto-layout';
import type { BrowserWorkspaceNodeModel } from '../../browser-graph/workspace';

export type ScopeAnalysisMode = 'primary' | 'direct' | 'subtree' | 'children-primary';

export type BrowserGraphWorkspaceProps = {
  state: BrowserSessionState;
  activeModeLabel: string;
  onShowScopeContainer: (scopeId?: string) => void;
  onAddScopeAnalysis: (scopeId: string, mode: ScopeAnalysisMode, kinds?: string[], childScopeKinds?: string[]) => void;
  onAddContainedEntities: (entityId: string, kinds?: string[]) => void;
  onAddPeerEntities: (entityId: string, containerKinds?: string[], peerKinds?: string[]) => void;
  onFocusScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onSelectEntity: (entityId: string, additive?: boolean) => void;
  onFocusRelationship: (relationshipId: string) => void;
  onExpandEntityDependencies: (entityId: string) => void;
  onExpandInboundDependencies: (entityId: string) => void;
  onExpandOutboundDependencies: (entityId: string) => void;
  onRemoveEntity: (entityId: string) => void;
  onRemoveSelection: () => void;
  onClearSelection?: () => void;
  onSelectAllEntities?: () => void;
  onIsolateSelection: () => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onSetClassPresentationMode?: (entityIds: string[], mode: BrowserClassPresentationMode) => void;
  onToggleClassPresentationMembers?: (entityIds: string[], memberKind: 'fields' | 'functions') => void;
  onMoveCanvasNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
  onReconcileCanvasNodePositions: (updates: Array<{ kind: 'scope' | 'entity'; id: string; x?: number; y?: number }>) => void;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
  onArrangeAllCanvasNodes: () => void;
  onArrangeCanvasWithMode?: (mode: BrowserAutoLayoutMode) => void;
  onArrangeCanvasAroundFocus: () => void;
  onClearCanvas: () => void;
  onFitView: () => void;
  onSetRelationshipRoutingMode?: (mode: 'orthogonal' | 'straight') => void;
  onReceiveTreeEntitiesDrop?: (entityIds: string[]) => void;
};

export type BrowserEntitySelectionAction = {
  key: string;
  label: string;
  disabled?: boolean;
};

export type DragStateNode = {
  node: Pick<BrowserCanvasNode, 'kind' | 'id'>;
  startX: number;
  startY: number;
};

export type DragState = {
  node: Pick<BrowserCanvasNode, 'kind' | 'id'>;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  nodes: DragStateNode[];
};

export type PanState = {
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
};

export type BrowserGraphWorkspaceInteractionHandlers = {
  onEntityAction: (actionKey: string) => void;
  onActivateRelationship: (relationshipId: string) => void;
  onActivateScopeNode: (scopeId: string) => void;
  onActivateEntityNode: (entityId: string, additive?: boolean) => void;
};

export type ViewportEventHandlers = {
  beginNodeDrag: (event: ReactMouseEvent<HTMLElement>, node: BrowserWorkspaceNodeModel) => void;
  beginViewportPan: (event: ReactMouseEvent<HTMLDivElement>) => void;
  handleViewportWheel: (event: ReactWheelEvent<HTMLDivElement>) => void;
  draggingNodeId?: string | null;
  isPanning?: boolean;
};
