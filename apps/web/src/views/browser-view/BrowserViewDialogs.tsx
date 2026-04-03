import { BrowserSavedCanvasDialog } from '../../components/saved-canvas/BrowserSavedCanvasDialog';
import { BrowserSourceTreeSwitcherDialog } from '../../components/browser-source-tree/BrowserSourceTreeSwitcherDialog';
import { BrowserViewpointDialog } from '../../components/browser-viewpoints/BrowserViewpointDialog';
import type { Repository, SnapshotSummary, Workspace } from '../../app-model';
import type { SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';
import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';

type BrowserViewDialogsProps = {
  browserSession: BrowserSessionContextValue;
  dialogs: {
    isViewpointDialogOpen: boolean;
    closeViewpointDialog: () => void;
    isSavedCanvasDialogOpen: boolean;
    closeSavedCanvasDialog: () => void;
    isSourceTreeSwitcherOpen: boolean;
    setIsSourceTreeSwitcherOpen: (value: boolean) => void;
  };
  selectedScopeLabel: string | null;
  selectedSnapshot: SnapshotSummary | null;
  selectedSnapshotLabel: string;
  sourceTreeLauncherItems: SourceTreeLauncherItem[];
  repositories: Repository[];
  selectedWorkspace: Workspace | null;
  savedCanvas: {
    draftName: string;
    setDraftName: (value: string) => void;
    handleSaveCurrentCanvas: () => Promise<unknown>;
    records: any[];
    currentCanvasId: string | null;
    isBusy: boolean;
    statusMessage: string | null;
    pendingSyncCount: number;
    currentCanvasHasLocalEdits: boolean;
    rebindingCanvasId: string | null;
    rebindingSummary: any;
    isOffline: boolean;
    availabilityByCanvasId: Record<string, any>;
    handleOpenCanvas: (canvasId: string, target: 'original' | 'currentTarget') => Promise<unknown>;
    handleOpenCanvasOnSelectedSnapshot: (canvasId: string) => Promise<unknown>;
    handleDeleteCanvas: (canvasId: string) => Promise<unknown>;
    handleRefreshRecords: () => Promise<unknown>;
    handleSyncNow: () => Promise<unknown>;
  };
  handlers: {
    handleInitializeImplicitWorkspace: () => Promise<unknown>;
    handleSelectSourceTree: (item: SourceTreeLauncherItem) => Promise<unknown>;
    handleCreateRepositoryFromDialog: (payload: { repositoryKey: string; name: string; sourceType: any; localPath: string; remoteUrl: string; defaultBranch: string; metadataJson: string; }) => Promise<unknown>;
    handleRequestReindexFromDialog: (repository: Repository) => Promise<unknown>;
    handleArchiveRepositoryFromDialog: (repository: Repository) => Promise<unknown>;
    handleUpdateRepositoryFromDialog: (repository: Repository, payload: any) => Promise<unknown>;
    handleDownloadSnapshotJsonFromDialog: (item: SourceTreeLauncherItem) => Promise<unknown>;
  };
};

export function BrowserViewDialogs({
  browserSession,
  dialogs,
  selectedScopeLabel,
  selectedSnapshot,
  selectedSnapshotLabel,
  sourceTreeLauncherItems,
  repositories,
  selectedWorkspace,
  savedCanvas,
  handlers,
}: BrowserViewDialogsProps) {
  return (
    <>
      <BrowserViewpointDialog
        isOpen={dialogs.isViewpointDialogOpen}
        index={browserSession.state.index}
        selectedScopeLabel={selectedScopeLabel}
        selection={browserSession.state.viewpointSelection}
        appliedViewpoint={browserSession.state.appliedViewpoint}
        presentationPreference={browserSession.state.viewpointPresentationPreference}
        onSelectViewpoint={browserSession.viewpoint.setSelectedViewpoint}
        onSelectScopeMode={browserSession.viewpoint.setScopeMode}
        onSelectApplyMode={browserSession.viewpoint.setApplyMode}
        onSelectVariant={browserSession.viewpoint.setVariant}
        onSelectPresentationPreference={browserSession.viewpoint.setPresentationPreference}
        onApplyViewpoint={browserSession.viewpoint.applySelectedViewpoint}
        onClose={dialogs.closeViewpointDialog}
      />

      <BrowserSavedCanvasDialog
        isOpen={dialogs.isSavedCanvasDialogOpen}
        draftName={savedCanvas.draftName}
        onDraftNameChange={savedCanvas.setDraftName}
        onClose={dialogs.closeSavedCanvasDialog}
        onSaveCurrentCanvas={() => void savedCanvas.handleSaveCurrentCanvas()}
        records={savedCanvas.records}
        currentCanvasId={savedCanvas.currentCanvasId}
        isBusy={savedCanvas.isBusy}
        statusMessage={savedCanvas.statusMessage}
        selectedSnapshotId={selectedSnapshot?.id ?? browserSession.state.activeSnapshot?.snapshotId ?? null}
        selectedSnapshotLabel={selectedSnapshotLabel}
        pendingSyncCount={savedCanvas.pendingSyncCount}
        currentCanvasHasLocalEdits={savedCanvas.currentCanvasHasLocalEdits}
        rebindingCanvasId={savedCanvas.rebindingCanvasId}
        rebindingSummary={savedCanvas.rebindingSummary}
        isOffline={savedCanvas.isOffline}
        availabilityByCanvasId={savedCanvas.availabilityByCanvasId}
        onOpenOriginalCanvas={(canvasId) => void savedCanvas.handleOpenCanvas(canvasId, 'original')}
        onOpenCurrentCanvas={(canvasId) => void savedCanvas.handleOpenCanvas(canvasId, 'currentTarget')}
        onOpenSelectedCanvas={(canvasId) => void savedCanvas.handleOpenCanvasOnSelectedSnapshot(canvasId)}
        onDeleteCanvas={(canvasId) => void savedCanvas.handleDeleteCanvas(canvasId)}
        onRefresh={() => void savedCanvas.handleRefreshRecords()}
        onSyncNow={() => void savedCanvas.handleSyncNow()}
      />

      <BrowserSourceTreeSwitcherDialog
        isOpen={dialogs.isSourceTreeSwitcherOpen}
        items={sourceTreeLauncherItems}
        repositories={repositories}
        selectedWorkspace={selectedWorkspace}
        onInitializeWorkspace={async () => { await handlers.handleInitializeImplicitWorkspace(); }}
        onSelectSourceTree={async (item) => { await handlers.handleSelectSourceTree(item); }}
        onCreateRepository={async (payload) => { await handlers.handleCreateRepositoryFromDialog(payload); }}
        onRequestReindex={async (repository) => { await handlers.handleRequestReindexFromDialog(repository); }}
        onArchiveRepository={async (repository) => { await handlers.handleArchiveRepositoryFromDialog(repository); }}
        onUpdateRepository={async (repository, payload) => { await handlers.handleUpdateRepositoryFromDialog(repository, payload); }}
        onDownloadSnapshotJson={async (item) => { await handlers.handleDownloadSnapshotJsonFromDialog(item); }}
        onClose={() => dialogs.setIsSourceTreeSwitcherOpen(false)}
      />
    </>
  );
}
