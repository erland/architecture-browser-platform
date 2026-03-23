import { appRoutes, getRouteMeta, normalizeRoutePath } from '../routing/appRoutes';

describe('appRoutes', () => {
  it('normalizes every registered route path without fallback', () => {
    expect(appRoutes.map((route) => normalizeRoutePath(route.path))).toEqual(appRoutes.map((route) => route.path));
  });

  it('falls back unknown routes to the browser screen', () => {
    expect(normalizeRoutePath('/unknown')).toBe('/browser');
    expect(normalizeRoutePath('')).toBe('/browser');
    expect(normalizeRoutePath('/repositories')).toBe('/sources');
    expect(normalizeRoutePath('/snapshots')).toBe('/sources');
  });

  it('returns metadata for compare and operations routes', () => {
    expect(getRouteMeta('/sources')).toEqual(expect.objectContaining({
      label: 'Manage sources',
      path: '/sources',
    }));
    expect(getRouteMeta('/operations')).toEqual(expect.objectContaining({
      label: 'Operations',
      path: '/operations',
    }));
  });
});
