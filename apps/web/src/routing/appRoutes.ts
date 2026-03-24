export const appRoutes = [
  { path: '/workspaces', label: 'Workspace context', description: 'Administration view for workspace-level setup and lifecycle management.' },
  { path: '/sources', label: 'Manage sources', description: 'Unified source management flow for source trees, indexing runs, and indexed versions.' },
  { path: '/browser', label: 'Browser', description: 'Focused architecture browser shell with overview, layout, dependency, entry-point, and search tabs.' },
  { path: '/compare', label: 'Compare', description: 'Compare one indexed version with another to inspect changes in structure, dependencies, and entry points.' },
  { path: '/operations', label: 'Operations', description: 'Dedicated operational administration, retention, failure review, and audit view.' },
] as const;

export type AppRoutePath = (typeof appRoutes)[number]['path'];

const routePathSet = new Set<string>(appRoutes.map((route) => route.path));
const legacySourceAliases = new Set<string>(['/repositories', '/snapshots']);

export function normalizeRoutePath(pathname: string): AppRoutePath {
  if (routePathSet.has(pathname)) {
    return pathname as AppRoutePath;
  }
  if (legacySourceAliases.has(pathname)) {
    return '/sources';
  }
  return '/browser';
}

export function getRouteMeta(pathname: AppRoutePath) {
  return appRoutes.find((route) => route.path === pathname) ?? appRoutes.find((route) => route.path === '/browser') ?? appRoutes[0];
}
