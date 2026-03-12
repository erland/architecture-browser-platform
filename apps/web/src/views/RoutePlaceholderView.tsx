import type { AppRoutePath } from '../routing/appRoutes';
import { getRouteMeta } from '../routing/appRoutes';

type RoutePlaceholderViewProps = {
  path: Exclude<AppRoutePath, '/legacy'>;
  onOpenLegacy: () => void;
};

export function RoutePlaceholderView({ path, onOpenLegacy }: RoutePlaceholderViewProps) {
  const route = getRouteMeta(path);

  return (
    <section className="card placeholder-view">
      <p className="eyebrow">Planned view</p>
      <h2>{route.label}</h2>
      <p className="lead placeholder-view__lead">{route.description}</p>
      <p className="muted">
        The route shell is now in place, but this screen is still a placeholder. The current end-to-end workspace remains available while the
        refactor moves each workflow into its own view.
      </p>
      <div className="actions">
        <button type="button" onClick={onOpenLegacy}>Open current workspace</button>
      </div>
    </section>
  );
}
