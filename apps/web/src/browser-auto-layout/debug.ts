import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from './types';

const LAYOUT_DEBUG_FLAG = 'browser.debug.layout';

export function isBrowserAutoLayoutDebugEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const query = new URLSearchParams(window.location.search);
    if (query.get('layoutDebug') === '1') {
      return true;
    }
    const storageValue = window.localStorage.getItem(LAYOUT_DEBUG_FLAG);
    return storageValue === '1' || storageValue === 'true';
  } catch {
    return false;
  }
}

export function logBrowserAutoLayoutRun(request: BrowserAutoLayoutRequest, result: BrowserAutoLayoutResult) {
  if (!isBrowserAutoLayoutDebugEnabled() || typeof console === 'undefined') {
    return;
  }

  const nodeSummaries = result.nodes.map((node) => ({
    id: node.id,
    kind: node.kind,
    x: node.x,
    y: node.y,
    pinned: Boolean(node.pinned),
    manuallyPlaced: Boolean(node.manuallyPlaced),
  }));

  console.groupCollapsed(`[browser-layout] auto-layout ${request.mode} nodes=${result.nodes.length} edges=${request.edges.length}`);
  console.log('request', {
    mode: request.mode,
    nodeCount: request.nodes.length,
    edgeCount: request.edges.length,
    hasState: Boolean(request.state),
    config: request.config ?? null,
  });
  console.table(nodeSummaries);
  console.groupEnd();
}
