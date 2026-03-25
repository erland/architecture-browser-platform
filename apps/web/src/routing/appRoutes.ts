export const browserRoutePath = '/browser' as const;

export const appRoutes = [
  {
    path: browserRoutePath,
    label: 'Browser',
    description: 'Browser-first architecture workspace with overview, layout, dependency, entry-point, and search tabs.',
  },
] as const;

export type AppRoutePath = typeof browserRoutePath;

// Keep a narrow alias list so older deep links continue to land in the Browser after the retired frontend pages were removed.
const browserAliases = new Set<string>(['/compare', '/operations', '/repositories', '/snapshots', '/sources', '/workspaces']);

export function normalizeRoutePath(pathname: string): AppRoutePath {
  return pathname === browserRoutePath || browserAliases.has(pathname) ? browserRoutePath : browserRoutePath;
}

export function getRouteMeta(_pathname: AppRoutePath) {
  return appRoutes[0];
}
