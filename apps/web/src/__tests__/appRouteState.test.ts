import { buildNavigationUrl, readRoutePath } from '../routing/appRouteState';

describe('appRouteState', () => {
  it('reads browser-managed route paths as the browser screen', () => {
    expect(readRoutePath('/browser')).toBe('/browser');
    expect(readRoutePath('/sources')).toBe('/browser');
    expect(readRoutePath('/snapshots')).toBe('/browser');
    expect(readRoutePath('/workspaces')).toBe('/browser');
    expect(readRoutePath('/compare')).toBe('/browser');
    expect(readRoutePath('/operations')).toBe('/browser');
  });

  it('falls back unknown route paths to the browser screen', () => {
    expect(readRoutePath('/missing')).toBe('/browser');
    expect(readRoutePath(undefined)).toBe('/browser');
  });

  it('builds navigation urls that preserve selection query params and hash fragments', () => {
    expect(buildNavigationUrl('/browser', '?workspace=ws-1&snapshot=snap-9', '#details')).toBe(
      '/browser?workspace=ws-1&snapshot=snap-9#details',
    );
  });
});
