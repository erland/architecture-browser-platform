export function BrowserNavigationOverflowControls({
  nodeId,
  hiddenCount,
  expanded,
  onToggle,
}: {
  nodeId: string;
  hiddenCount: number;
  expanded: boolean;
  onToggle: (nodeId: string) => void;
}) {
  if (hiddenCount <= 0) {
    return null;
  }

  return (
    <li className="browser-tree__item browser-tree__item--overflow">
      <button
        type="button"
        className="browser-tree__show-more"
        onClick={() => onToggle(nodeId)}
        aria-expanded={expanded}
      >
        {expanded ? 'Show less' : `Show ${hiddenCount} more`}
      </button>
    </li>
  );
}
