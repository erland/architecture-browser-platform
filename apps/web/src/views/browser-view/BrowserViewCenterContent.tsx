import { BrowserGraphWorkspace } from '../../components/browser-graph-workspace/BrowserGraphWorkspace';
import { BrowserSourceTreeLauncher } from '../../components/browser-source-tree/BrowserSourceTreeLauncher';
import type { SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';
import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';

export type BrowserViewCenterContentProps = {
  activeModeLabel: string;
  browserSession: BrowserSessionContextValue;
  hasSelectedWorkspace: boolean;
  hasSelectedSnapshot: boolean;
  hasPreparedSession: boolean;
  sourceTreeLauncherItems: SourceTreeLauncherItem[];
  onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
  onOpenSourceTreeDialog: () => void;
  onAddScopeAnalysis: (scopeId: string, mode: 'primary' | 'direct' | 'subtree' | 'children-primary', kinds?: string[], childScopeKinds?: string[]) => void;
  onAddContainedEntities: (entityId: string, kinds?: string[]) => void;
  onAddPeerEntities: (entityId: string, containerKinds?: string[], peerKinds?: string[]) => void;
};

export function BrowserViewCenterContent({
  activeModeLabel,
  browserSession,
  hasSelectedWorkspace,
  hasSelectedSnapshot,
  hasPreparedSession,
  sourceTreeLauncherItems,
  onSelectSourceTree,
  onOpenSourceTreeDialog,
  onAddScopeAnalysis,
  onAddContainedEntities,
  onAddPeerEntities,
}: BrowserViewCenterContentProps) {
  if (!hasPreparedSession) {
    const title = !hasSelectedWorkspace
      ? 'Open a source tree'
      : !hasSelectedSnapshot
        ? 'Choose an indexed version to open'
        : 'Finishing Browser session preparation';

    const description = !hasSelectedWorkspace
      ? 'Choose a previously indexed source tree or add a new one to start exploring the latest imported architecture snapshot in Browser.'
      : !hasSelectedSnapshot
        ? 'Select a source tree below or open the Source tree dialog to pick which indexed version should be loaded into Browser.'
        : 'Browser is waiting for the prepared local snapshot payload. You can select another indexed source tree or open the Source tree dialog.';

    return (
      <BrowserSourceTreeLauncher
        title={title}
        description={description}
        items={sourceTreeLauncherItems}
        onSelectSourceTree={onSelectSourceTree}
        onOpenSourceTreeDialog={onOpenSourceTreeDialog}
      />
    );
  }

  return (
    <div className="browser-workspace__stage">
      <BrowserGraphWorkspace
        state={browserSession.state}
        activeModeLabel={activeModeLabel}
        onShowScopeContainer={(scopeId) => {
          const focusedScopeId = browserSession.state.focusedElement?.kind === 'scope'
            ? browserSession.state.focusedElement.id
            : null;
          const targetScopeId = scopeId ?? focusedScopeId ?? browserSession.state.selectedScopeId;
          if (!targetScopeId) {
            return;
          }
          browserSession.canvas.addScopeToCanvas(targetScopeId);
          browserSession.navigation.selectScope(targetScopeId);
          browserSession.factsPanel.focusElement({ kind: 'scope', id: targetScopeId });
          browserSession.factsPanel.open('scope', 'right');
        }}
        onAddScopeAnalysis={onAddScopeAnalysis}
        onAddContainedEntities={onAddContainedEntities}
        onAddPeerEntities={onAddPeerEntities}
        onFocusScope={(scopeId) => {
          browserSession.navigation.selectScope(scopeId);
          browserSession.factsPanel.focusElement({ kind: 'scope', id: scopeId });
          browserSession.factsPanel.open('scope', 'right');
        }}
        onFocusEntity={(entityId) => {
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        }}
        onSelectEntity={(entityId, additive) => {
          browserSession.canvas.selectEntity(entityId, additive);
          browserSession.factsPanel.open('entity', 'right');
        }}
        onFocusRelationship={(relationshipId) => {
          browserSession.factsPanel.focusElement({ kind: 'relationship', id: relationshipId });
          browserSession.factsPanel.open('relationship', 'right');
        }}
        onExpandEntityDependencies={(entityId) => {
          browserSession.canvas.addDependenciesToCanvas(entityId);
          browserSession.canvas.selectEntity(entityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        }}
        onExpandInboundDependencies={(entityId) => {
          browserSession.canvas.addDependenciesToCanvas(entityId, 'INBOUND');
          browserSession.canvas.selectEntity(entityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        }}
        onExpandOutboundDependencies={(entityId) => {
          browserSession.canvas.addDependenciesToCanvas(entityId, 'OUTBOUND');
          browserSession.canvas.selectEntity(entityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        }}
        onRemoveEntity={(entityId) => browserSession.canvas.removeEntityFromCanvas(entityId)}
        onRemoveSelection={browserSession.canvas.removeSelection}
        onClearSelection={browserSession.canvas.clearSelection}
        onSelectAllEntities={browserSession.canvas.selectAllEntities}
        onIsolateSelection={browserSession.canvas.isolateSelection}
        onTogglePinNode={browserSession.canvas.toggleNodePin}
        onSetClassPresentationMode={browserSession.canvas.setClassPresentationMode}
        onToggleClassPresentationMembers={browserSession.canvas.toggleClassPresentationMembers}
        onMoveCanvasNode={browserSession.canvas.moveNode}
        onReconcileCanvasNodePositions={browserSession.canvas.reconcileNodePositions}
        onSetCanvasViewport={browserSession.canvas.setViewport}
        onArrangeAllCanvasNodes={browserSession.canvas.arrangeAllNodes}
        onArrangeCanvasWithMode={browserSession.canvas.arrangeWithMode}
        onArrangeCanvasAroundFocus={browserSession.canvas.arrangeAroundFocus}
        onClearCanvas={browserSession.canvas.clear}
        onFitView={browserSession.canvas.fitView}
        onReceiveTreeEntitiesDrop={(entityIds) => {
          browserSession.canvas.addEntitiesToCanvas(entityIds);
          const focusEntityId = entityIds[0];
          if (!focusEntityId) {
            return;
          }
          browserSession.canvas.selectEntity(focusEntityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: focusEntityId });
          browserSession.factsPanel.open('entity', 'right');
        }}
      />
    </div>
  );
}
