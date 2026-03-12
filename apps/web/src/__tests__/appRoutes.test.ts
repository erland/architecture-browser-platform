import { appRoutes, getRouteMeta, normalizeRoutePath } from '../routing/appRoutes';

describe('appRoutes', () => {
  it('normalizes every registered route path without fallback', () => {
    expect(appRoutes.map((route) => normalizeRoutePath(route.path))).toEqual(appRoutes.map((route) => route.path));
  });

  it('falls back unknown routes to the legacy workspace screen', () => {
    expect(normalizeRoutePath('/unknown')).toBe('/legacy');
    expect(normalizeRoutePath('')).toBe('/legacy');
  });

  it('returns metadata for compare and operations routes', () => {
    expect(getRouteMeta('/compare')).toEqual(expect.objectContaining({
      label: 'Compare',
      path: '/compare',
    }));
    expect(getRouteMeta('/operations')).toEqual(expect.objectContaining({
      label: 'Operations',
      path: '/operations',
    }));
  });
});
