export const appRoutes = [
  { path: '/legacy', label: 'Current workspace', description: 'Existing stacked workspace screen kept available during migration.' },
  { path: '/workspaces', label: 'Workspaces', description: 'Dedicated workspace administration screen coming in a later step.' },
  { path: '/repositories', label: 'Repositories', description: 'Repository registration and run flows will move here.' },
  { path: '/snapshots', label: 'Snapshots', description: 'Snapshot catalog and selection will move here.' },
  { path: '/browser', label: 'Browser', description: 'Focused architecture browser view will be introduced here.' },
  { path: '/compare', label: 'Compare', description: 'Snapshot comparison workflow will move here.' },
  { path: '/operations', label: 'Operations', description: 'Operational administration and audit views will move here.' },
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
