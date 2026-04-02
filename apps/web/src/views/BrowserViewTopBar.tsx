import { BrowserTopSearch, type BrowserTopSearchProps } from '../components/BrowserTopSearch';

type BrowserViewTopBarProps = {
  search: BrowserTopSearchProps;
  onOpenSourceTreeDialog: () => void;
  onOpenSavedCanvasDialog: () => void;
};

export function BrowserViewTopBar({
  search,
  onOpenSourceTreeDialog,
  onOpenSavedCanvasDialog,
}: BrowserViewTopBarProps) {
  return (
    <header className="card browser-workspace__topbar">
      <div className="browser-workspace__header-row browser-workspace__header-row--compact">
        <div className="browser-workspace__title-block">
          <p className="eyebrow">Browser</p>
          <h2>Architecture Browser</h2>
        </div>

        <div className="browser-workspace__search-slot">
          <BrowserTopSearch {...search} />
        </div>

        <div className="browser-workspace__header-actions">
          <button type="button" className="browser-workspace__source-tree-button" onClick={onOpenSourceTreeDialog}>Source tree</button>
          <button type="button" className="button-secondary browser-workspace__saved-canvas-button" onClick={onOpenSavedCanvasDialog}>Canvases</button>
        </div>
      </div>
    </header>
  );
}
