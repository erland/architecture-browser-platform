import { useEffect } from 'react';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';
import { BrowserSourceTreeLauncher } from './BrowserSourceTreeLauncher';

export type BrowserSourceTreeSwitcherDialogProps = {
  isOpen: boolean;
  workspaceName: string | null;
  currentSourceTreeLabel: string;
  currentIndexedVersionLabel: string;
  items: SourceTreeLauncherItem[];
  onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
  onOpenRepositories: () => void;
  onOpenSnapshots: () => void;
  onOpenWorkspaces: () => void;
  onClose: () => void;
};

export function BrowserSourceTreeSwitcherDialog({
  isOpen,
  workspaceName,
  currentSourceTreeLabel,
  currentIndexedVersionLabel,
  items,
  onSelectSourceTree,
  onOpenRepositories,
  onOpenSnapshots,
  onOpenWorkspaces,
  onClose,
}: BrowserSourceTreeSwitcherDialogProps) {
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (item: SourceTreeLauncherItem) => {
    onSelectSourceTree(item);
    onClose();
  };

  const handleOpenRepositories = () => {
    onClose();
    onOpenRepositories();
  };

  const handleOpenSnapshots = () => {
    onClose();
    onOpenSnapshots();
  };

  const handleOpenWorkspaces = () => {
    onClose();
    onOpenWorkspaces();
  };

  return (
    <div className="browser-dialog" role="presentation">
      <button
        type="button"
        className="browser-dialog__backdrop"
        aria-label="Close source tree switcher"
        onClick={onClose}
      />
      <section
        className="card browser-dialog__surface browser-dialog__surface--source-tree"
        role="dialog"
        aria-modal="true"
        aria-labelledby="browser-source-tree-switcher-title"
      >
        <div className="browser-dialog__header">
          <div>
            <p className="eyebrow">Browser source tree</p>
            <h2 id="browser-source-tree-switcher-title">Switch source tree</h2>
            <p className="muted browser-dialog__lead">
              Choose another source tree or open Manage sources without keeping setup controls visible all the time.
            </p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>

        <div className="browser-dialog__summary" aria-label="Current source tree summary">
          <span className="badge">{currentSourceTreeLabel}</span>
          <span className="badge">{currentIndexedVersionLabel}</span>
          {workspaceName ? <span className="badge">Workspace context {workspaceName}</span> : null}
        </div>

        <BrowserSourceTreeLauncher
          title="Open another source tree"
          description="Switch Browser to another source tree or continue to Manage sources when you need to add a new one."
          workspaceName={workspaceName}
          items={items}
          onSelectSourceTree={handleSelect}
          onOpenRepositories={handleOpenRepositories}
          onOpenSnapshots={handleOpenSnapshots}
          onOpenWorkspaces={handleOpenWorkspaces}
        />
      </section>
    </div>
  );
}
