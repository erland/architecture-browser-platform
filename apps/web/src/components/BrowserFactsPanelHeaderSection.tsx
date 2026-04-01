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

export function FactsPanelActions({ actions, onTogglePinNode, onIsolateSelection, onRemoveSelection }: Pick<BrowserFactsPanelProps, 'onTogglePinNode' | 'onIsolateSelection' | 'onRemoveSelection'> & { actions: BrowserFactsPanelActionsModel }) {
  return (
    <div className="browser-facts-panel__actions">
      {actions.pinEntityAction ? (() => { const pinAction = actions.pinEntityAction; return <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'entity', id: pinAction.entityId })}>{pinAction.label}</button>; })() : null}
      {actions.canIsolateSelection ? <button type="button" className="button-secondary" onClick={onIsolateSelection}>Isolate</button> : null}
      {actions.canRemoveSelection ? <button type="button" className="button-secondary" onClick={onRemoveSelection}>Remove from canvas</button> : null}
    </div>
  );
}
