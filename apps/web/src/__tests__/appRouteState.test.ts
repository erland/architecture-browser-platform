import { buildNavigationUrl, readRoutePath } from '../routing/appRouteState';

describe('appRouteState', () => {
  it('reads known route paths directly', () => {
    expect(readRoutePath('/browser')).toBe('/browser');
    expect(readRoutePath('/sources')).toBe('/sources');
    expect(readRoutePath('/snapshots')).toBe('/sources');
  });

  it('falls back unknown route paths to the browser screen', () => {
    expect(readRoutePath('/missing')).toBe('/browser');
    expect(readRoutePath(undefined)).toBe('/browser');
  });

  it('builds navigation urls that preserve selection query params and hash fragments', () => {
    expect(buildNavigationUrl('/compare', '?workspace=ws-1&snapshot=snap-9', '#details')).toBe(
      '/compare?workspace=ws-1&snapshot=snap-9#details',
    );
  });
});
