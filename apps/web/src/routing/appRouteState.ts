import { normalizeRoutePath, type AppRoutePath } from './appRoutes';

export function readRoutePath(pathname: string | null | undefined): AppRoutePath {
  return normalizeRoutePath(pathname ?? '');
}

export function buildNavigationUrl(targetPath: AppRoutePath, currentSearch: string, currentHash: string): string {
  return `${targetPath}${currentSearch}${currentHash}`;
}
