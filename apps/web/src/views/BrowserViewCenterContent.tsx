import { BrowserGraphWorkspace } from '../components/BrowserGraphWorkspace';
import { BrowserSourceTreeLauncher } from '../components/BrowserSourceTreeLauncher';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';

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
          browserSession.addScopeToCanvas(targetScopeId);
          browserSession.selectScope(targetScopeId);
          browserSession.focusElement({ kind: 'scope', id: targetScopeId });
          browserSession.openFactsPanel('scope', 'right');
        }}
        onAddScopeAnalysis={onAddScopeAnalysis}
        onAddContainedEntities={onAddContainedEntities}
        onAddPeerEntities={onAddPeerEntities}
        onFocusScope={(scopeId) => {
          browserSession.selectScope(scopeId);
          browserSession.focusElement({ kind: 'scope', id: scopeId });
          browserSession.openFactsPanel('scope', 'right');
        }}
        onFocusEntity={(entityId) => {
          browserSession.selectCanvasEntity(entityId);
          browserSession.focusElement({ kind: 'entity', id: entityId });
          browserSession.openFactsPanel('entity', 'right');
        }}
        onSelectEntity={(entityId, additive) => {
          browserSession.selectCanvasEntity(entityId, additive);
          browserSession.openFactsPanel('entity', 'right');
        }}
        onFocusRelationship={(relationshipId) => {
          browserSession.focusElement({ kind: 'relationship', id: relationshipId });
          browserSession.openFactsPanel('relationship', 'right');
        }}
        onExpandEntityDependencies={(entityId) => {
          browserSession.addDependenciesToCanvas(entityId);
          browserSession.selectCanvasEntity(entityId);
          browserSession.focusElement({ kind: 'entity', id: entityId });
          browserSession.openFactsPanel('entity', 'right');
        }}
        onExpandInboundDependencies={(entityId) => {
          browserSession.addDependenciesToCanvas(entityId, 'INBOUND');
          browserSession.selectCanvasEntity(entityId);
          browserSession.focusElement({ kind: 'entity', id: entityId });
          browserSession.openFactsPanel('entity', 'right');
        }}
        onExpandOutboundDependencies={(entityId) => {
          browserSession.addDependenciesToCanvas(entityId, 'OUTBOUND');
          browserSession.selectCanvasEntity(entityId);
          browserSession.focusElement({ kind: 'entity', id: entityId });
          browserSession.openFactsPanel('entity', 'right');
        }}
        onRemoveEntity={(entityId) => browserSession.removeEntityFromCanvas(entityId)}
        onRemoveSelection={browserSession.removeCanvasSelection}
        onIsolateSelection={browserSession.isolateCanvasSelection}
        onTogglePinNode={browserSession.toggleCanvasNodePin}
        onMoveCanvasNode={browserSession.moveCanvasNode}
        onSetCanvasViewport={browserSession.setCanvasViewport}
        onArrangeAllCanvasNodes={browserSession.arrangeAllCanvasNodes}
        onArrangeCanvasAroundFocus={browserSession.arrangeCanvasAroundFocus}
        onClearCanvas={browserSession.clearCanvas}
        onFitView={browserSession.fitCanvasView}
      />
    </div>
  );
}
