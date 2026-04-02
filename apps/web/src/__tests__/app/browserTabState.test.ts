import { buildBrowserTabSearch, DEFAULT_BROWSER_TAB, readBrowserTabFromSearch } from '../../routing/browserTabState';

describe('browserTabState', () => {
  it('uses overview as the default tab when the search param is missing or invalid', () => {
    expect(readBrowserTabFromSearch('')).toBe(DEFAULT_BROWSER_TAB);
    expect(readBrowserTabFromSearch('?browserTab=invalid')).toBe(DEFAULT_BROWSER_TAB);
  });

  it('reads a valid browser tab from the query string', () => {
    expect(readBrowserTabFromSearch('?browserTab=dependencies')).toBe('dependencies');
    expect(readBrowserTabFromSearch('?workspace=ws-1&browserTab=search')).toBe('search');
  });

  it('writes browser tab state back to the query string while preserving app selection params', () => {
    expect(buildBrowserTabSearch('?workspace=ws-1&snapshot=snap-3', 'layout')).toBe(
      '?workspace=ws-1&snapshot=snap-3&browserTab=layout',
    );
  });

  it('removes browserTab when the active tab returns to the default', () => {
    expect(buildBrowserTabSearch('?workspace=ws-1&browserTab=search', DEFAULT_BROWSER_TAB)).toBe('?workspace=ws-1');
  });
});
