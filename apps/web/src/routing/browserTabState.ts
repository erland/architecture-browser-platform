import { isBrowserTabKey, type BrowserTabKey } from './browserTabs';

export const DEFAULT_BROWSER_TAB: BrowserTabKey = 'overview';

export function readBrowserTabFromSearch(search: string): BrowserTabKey {
  const params = new URLSearchParams(search);
  const tab = params.get('browserTab');
  return isBrowserTabKey(tab) ? tab : DEFAULT_BROWSER_TAB;
}

export function buildBrowserTabSearch(search: string, activeTab: BrowserTabKey): string {
  const params = new URLSearchParams(search);
  if (activeTab === DEFAULT_BROWSER_TAB) {
    params.delete('browserTab');
  } else {
    params.set('browserTab', activeTab);
  }
  const rendered = params.toString();
  return rendered.length ? `?${rendered}` : '';
}
