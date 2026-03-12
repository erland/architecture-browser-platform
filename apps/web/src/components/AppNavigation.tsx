import { appRoutes, type AppRoutePath } from '../routing/appRoutes';

type AppNavigationProps = {
  currentPath: AppRoutePath;
  onNavigate: (path: AppRoutePath) => void;
};

export function AppNavigation({ currentPath, onNavigate }: AppNavigationProps) {
  return (
    <nav className="app-nav card" aria-label="Primary">
      <div>
        <p className="eyebrow">Navigation</p>
        <h2 className="app-nav__title">Platform views</h2>
        <p className="muted app-nav__lead">
          Step 4 moves repository registration and run requests into their own view while snapshot browsing and operations continue migrating out of the temporary stacked screen.
        </p>
      </div>
      <div className="app-nav__links">
        {appRoutes.map((route) => {
          const isActive = route.path === currentPath;
          return (
            <button
              key={route.path}
              type="button"
              className={isActive ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => onNavigate(route.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-link__label">{route.label}</span>
              <span className="nav-link__description">{route.description}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
