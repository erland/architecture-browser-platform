export const appRoutes = [
  { path: '/legacy', label: 'Current workspace', description: 'Temporary stacked screen for detailed snapshot exploration and operations.' },
  { path: '/workspaces', label: 'Workspaces', description: 'Dedicated workspace administration view.' },
  { path: '/repositories', label: 'Repositories', description: 'Dedicated repository registration and run request view.' },
  { path: '/snapshots', label: 'Snapshots', description: 'Dedicated snapshot catalog, selection, and handoff into Browser or Compare.' },
  { path: '/browser', label: 'Browser', description: 'Focused architecture browser shell with overview, layout, dependency, entry-point, and search tabs.' },
  { path: '/compare', label: 'Compare', description: 'Dedicated snapshot comparison workflow for comparing the selected baseline snapshot with another imported snapshot.' },
  { path: '/operations', label: 'Operations', description: 'Dedicated operational administration, retention, failure review, and audit view.' },
] as const;

export type AppRoutePath = (typeof appRoutes)[number]['path'];

const routePathSet = new Set<string>(appRoutes.map((route) => route.path));

export function normalizeRoutePath(pathname: string): AppRoutePath {
  if (routePathSet.has(pathname)) {
    return pathname as AppRoutePath;
  }
  return '/legacy';
}

export function getRouteMeta(pathname: AppRoutePath) {
  return appRoutes.find((route) => route.path === pathname) ?? appRoutes[0];
}
