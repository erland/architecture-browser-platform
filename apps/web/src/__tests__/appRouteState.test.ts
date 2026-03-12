import { buildNavigationUrl, readRoutePath } from '../routing/appRouteState';

describe('appRouteState', () => {
  it('reads known route paths directly', () => {
    expect(readRoutePath('/browser')).toBe('/browser');
    expect(readRoutePath('/snapshots')).toBe('/snapshots');
  });

  it('falls back unknown route paths to the legacy screen', () => {
    expect(readRoutePath('/missing')).toBe('/legacy');
    expect(readRoutePath(undefined)).toBe('/legacy');
  });

  it('builds navigation urls that preserve selection query params and hash fragments', () => {
    expect(buildNavigationUrl('/compare', '?workspace=ws-1&snapshot=snap-9', '#details')).toBe(
      '/compare?workspace=ws-1&snapshot=snap-9#details',
    );
  });
});
