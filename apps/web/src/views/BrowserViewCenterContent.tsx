import { BrowserGraphWorkspace } from '../components/BrowserGraphWorkspace';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';

export type BrowserViewCenterContentProps = {
  activeModeLabel: string;
  browserSession: BrowserSessionContextValue;
  hasSelectedWorkspace: boolean;
  hasSelectedSnapshot: boolean;
  hasPreparedSession: boolean;
  onOpenRepositories: () => void;
  onOpenSnapshots: () => void;
  onOpenLegacy: () => void;
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
  onOpenRepositories,
  onOpenSnapshots,
  onOpenLegacy,
  onAddScopeAnalysis,
  onAddContainedEntities,
  onAddPeerEntities,
}: BrowserViewCenterContentProps) {
  if (!hasSelectedWorkspace) {
    return (
      <article className="card empty-state-card browser-empty-state">
        <h2>No workspace selected</h2>
        <p className="muted">Choose a workspace first, then select a snapshot to enter the focused Browser experience.</p>
        <div className="actions">
          <button type="button" onClick={onOpenRepositories}>Open Repositories</button>
          <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Open Snapshots</button>
        </div>
      </article>
    );
  }

  if (!hasSelectedSnapshot) {
    return (
      <article className="card empty-state-card browser-empty-state">
        <h2>No snapshot selected</h2>
        <p className="muted">Use the Snapshots view to choose an imported snapshot, prepare it locally, then return here to browse the architecture fully in-browser.</p>
        <div className="actions">
          <button type="button" onClick={onOpenSnapshots}>Open Snapshots</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
        </div>
      </article>
    );
  }

  if (!hasPreparedSession) {
    return (
      <article className="card empty-state-card browser-empty-state">
        <h2>Prepared Browser session required</h2>
        <p className="muted">This Browser route now depends entirely on the prepared local snapshot payload and indexes. Prepare the snapshot from Snapshots before continuing.</p>
        <div className="actions">
          <button type="button" onClick={onOpenSnapshots}>Prepare snapshot</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
        </div>
      </article>
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
