import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import type { AppRoutePath } from '../routing/appRoutes';
import { getRouteMeta } from '../routing/appRoutes';

type RoutePlaceholderViewProps = {
  path: Exclude<AppRoutePath, '/legacy' | '/workspaces'>;
  onOpenLegacy: () => void;
};

export function RoutePlaceholderView({ path, onOpenLegacy }: RoutePlaceholderViewProps) {
  const route = getRouteMeta(path);
  const selection = useAppSelectionContext();

  return (
    <section className="card placeholder-view">
      <p className="eyebrow">Planned view</p>
      <h2>{route.label}</h2>
      <p className="lead placeholder-view__lead">{route.description}</p>
      <p className="muted">
        The route shell and persistent app context are in place, and the dedicated Workspaces view is now live. The current end-to-end workspace remains available while the
        rest of the refactor moves each workflow into its own view.
      </p>
      <div className="selection-summary selection-summary--compact">
        <span className="badge">Workspace: {selection.selectedWorkspaceId ?? '—'}</span>
        <span className="badge">Repository: {selection.selectedRepositoryId ?? '—'}</span>
        <span className="badge">Snapshot: {selection.selectedSnapshotId ?? '—'}</span>
      </div>
      <div className="actions">
        <button type="button" onClick={onOpenLegacy}>Open current workspace</button>
      </div>
    </section>
  );
}
