import { useEffect, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { buildBrowserTabSearch } from '../../../../routing/browserTabState';
import type { BrowserTabKey } from '../../../../routing/browserTabs';
import type { BrowserTopSearchScopeMode } from '../../../../components/browser-search/BrowserTopSearch';
import { clampWidth, readBrowserTabFromLocation, readStoredPaneWidth } from '../../browserView.shared';

export type BrowserViewLayoutState = {
  activeTab: BrowserTabKey;
  setActiveTab: (tab: BrowserTabKey) => void;
  topSearchScopeMode: BrowserTopSearchScopeMode;
  setTopSearchScopeMode: (mode: BrowserTopSearchScopeMode) => void;
  railWidth: number;
  inspectorWidth: number;
  isRailCollapsed: boolean;
  setIsRailCollapsed: (collapsed: boolean) => void;
  isInspectorCollapsed: boolean;
  setIsInspectorCollapsed: (collapsed: boolean) => void;
  startPaneResize: (pane: 'rail' | 'inspector') => (event: ReactMouseEvent<HTMLDivElement>) => void;
  layoutStyle: CSSProperties;
};

export function useBrowserViewLayout(): BrowserViewLayoutState {
  const [activeTab, setActiveTab] = useState<BrowserTabKey>(() => readBrowserTabFromLocation());
  const [topSearchScopeMode, setTopSearchScopeMode] = useState<BrowserTopSearchScopeMode>('selected-scope');
  const [railWidth, setRailWidth] = useState<number>(() => readStoredPaneWidth('browser.railWidth', 280));
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => readStoredPaneWidth('browser.inspectorWidth', 320));
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(() => readStoredPaneWidth('browser.railCollapsed', 0) === 1);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(() => readStoredPaneWidth('browser.inspectorCollapsed', 0) === 1);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(readBrowserTabFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const nextSearch = buildBrowserTabSearch(window.location.search, activeTab);
    if (nextSearch !== window.location.search) {
      window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}${window.location.hash}`);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.railWidth', String(railWidth));
  }, [railWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.inspectorWidth', String(inspectorWidth));
  }, [inspectorWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.railCollapsed', isRailCollapsed ? '1' : '0');
  }, [isRailCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.inspectorCollapsed', isInspectorCollapsed ? '1' : '0');
  }, [isInspectorCollapsed]);

  const startPaneResize = (pane: 'rail' | 'inspector') => (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startingX = event.clientX;
    const startingRailWidth = railWidth;
    const startingInspectorWidth = inspectorWidth;
    document.body.classList.add('browser-resize-active');

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startingX;
      if (pane === 'rail') {
        setRailWidth(clampWidth(startingRailWidth + delta, 220, 460));
        return;
      }
      setInspectorWidth(clampWidth(startingInspectorWidth - delta, 260, 520));
    };

    const handleMouseUp = () => {
      document.body.classList.remove('browser-resize-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const layoutStyle = {
    '--browser-rail-width': `${railWidth}px`,
    '--browser-inspector-width': `${inspectorWidth}px`,
    '--browser-layout-columns': `${isRailCollapsed ? '48px' : `minmax(220px, ${railWidth}px)`} ${isRailCollapsed ? '0px' : '8px'} minmax(0, 1fr) ${isInspectorCollapsed ? '0px' : '8px'} ${isInspectorCollapsed ? '48px' : `minmax(260px, ${inspectorWidth}px)`}`,
  } as CSSProperties;

  return {
    activeTab,
    setActiveTab,
    topSearchScopeMode,
    setTopSearchScopeMode,
    railWidth,
    inspectorWidth,
    isRailCollapsed,
    setIsRailCollapsed,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    startPaneResize,
    layoutStyle,
  };
}
