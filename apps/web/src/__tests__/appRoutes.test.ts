import { appRoutes, getRouteMeta, normalizeRoutePath } from '../routing/appRoutes';

describe('appRoutes', () => {
  it('normalizes every registered route path without fallback', () => {
    expect(appRoutes.map((route) => normalizeRoutePath(route.path))).toEqual(appRoutes.map((route) => route.path));
  });

  it('falls back unknown and retired routes to the browser screen', () => {
    expect(normalizeRoutePath('/unknown')).toBe('/browser');
    expect(normalizeRoutePath('')).toBe('/browser');
    expect(normalizeRoutePath('/operations')).toBe('/browser');
    expect(normalizeRoutePath('/repositories')).toBe('/browser');
    expect(normalizeRoutePath('/snapshots')).toBe('/browser');
    expect(normalizeRoutePath('/sources')).toBe('/browser');
    expect(normalizeRoutePath('/workspaces')).toBe('/browser');
  });

  it('returns metadata for the browser route', () => {
    expect(getRouteMeta('/browser')).toEqual(expect.objectContaining({
      label: 'Browser',
      path: '/browser',
    }));
  });
});
