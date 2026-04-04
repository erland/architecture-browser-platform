import type { BrowserFactsPanelProps } from './BrowserFactsPanel';
import type { BrowserFactsPanelActionsModel, BrowserFactsPanelHeaderModel } from './BrowserFactsPanel.types';

export function FactsPanelHeader({ header, onClose }: Pick<BrowserFactsPanelProps, 'onClose'> & { header: BrowserFactsPanelHeaderModel }) {
  return (
    <>
      <div className="browser-facts-panel__header">
        <div>
          <p className="eyebrow">Facts panel</p>
          <h3>{header.title}</h3>
          <p className="muted">{header.subtitle}</p>
        </div>
        <button type="button" className="button-secondary" onClick={onClose}>Hide</button>
      </div>

      <div className="browser-facts-panel__badges">
        {header.badges.map((badge) => <span key={badge} className="badge">{badge}</span>)}
      </div>

      <div className="browser-facts-panel__summary">
        {header.summary.map((line) => <p key={line} className="muted">{line}</p>)}
      </div>
    </>
  );
}

export function FactsPanelActions({ actions, onAddEntities, onTogglePinNode, onSetClassPresentationMode, onToggleClassPresentationMembers, onIsolateSelection, onRemoveSelection }: Pick<BrowserFactsPanelProps, 'onAddEntities' | 'onTogglePinNode' | 'onSetClassPresentationMode' | 'onToggleClassPresentationMembers' | 'onIsolateSelection' | 'onRemoveSelection'> & { actions: BrowserFactsPanelActionsModel }) {
  return (
    <div className="browser-facts-panel__actions">
      {actions.addEntityAction ? (() => { const addAction = actions.addEntityAction; return <button type="button" className="button-secondary" onClick={() => onAddEntities([addAction.entityId])}>{addAction.label}</button>; })() : null}
      {actions.pinEntityAction ? (() => { const pinAction = actions.pinEntityAction; return <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'entity', id: pinAction.entityId })}>{pinAction.label}</button>; })() : null}
      {actions.classPresentationActions ? (() => { const classActions = actions.classPresentationActions; const showSimpleAction = classActions.entityIds.length !== 1 || classActions.mode !== 'simple'; const showCompartmentsAction = classActions.entityIds.length !== 1 || classActions.mode !== 'compartments'; const showMemberToggleActions = classActions.entityIds.length !== 1 || classActions.mode === 'compartments'; return <>
        {showSimpleAction ? <button type="button" className="button-secondary" onClick={() => onSetClassPresentationMode(classActions.entityIds, 'simple')}>Simple</button> : null}
        {showCompartmentsAction ? <button type="button" className="button-secondary" onClick={() => onSetClassPresentationMode(classActions.entityIds, 'compartments')}>Compartments</button> : null}
        {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={() => onToggleClassPresentationMembers(classActions.entityIds, 'fields')}>{classActions.entityIds.length === 1 ? (classActions.showFields ? 'Hide fields' : 'Show fields') : 'Toggle fields'}</button> : null}
        {showMemberToggleActions ? <button type="button" className="button-secondary" onClick={() => onToggleClassPresentationMembers(classActions.entityIds, 'functions')}>{classActions.entityIds.length === 1 ? (classActions.showFunctions ? 'Hide functions' : 'Show functions') : 'Toggle functions'}</button> : null}
      </>; })() : null}
      {actions.canIsolateSelection ? <button type="button" className="button-secondary" onClick={onIsolateSelection}>Isolate</button> : null}
      {actions.canRemoveSelection ? <button type="button" className="button-secondary" onClick={onRemoveSelection}>Remove from canvas</button> : null}
    </div>
  );
}
