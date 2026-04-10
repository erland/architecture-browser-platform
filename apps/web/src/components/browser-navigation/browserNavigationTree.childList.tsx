import type { ReactNode } from 'react';
import { BrowserNavigationOverflowControls } from './browserNavigationTree.overflowControls';

export function BrowserNavigationChildList({
  children,
  hasChildren,
  isExpanded,
  hiddenChildrenCount,
  isChildListExpanded,
  nodeId,
  onToggleChildList,
}: {
  children: ReactNode;
  hasChildren: boolean;
  isExpanded: boolean;
  hiddenChildrenCount: number;
  isChildListExpanded: boolean;
  nodeId: string;
  onToggleChildList: (nodeId: string) => void;
}) {
  if (!hasChildren || !isExpanded) {
    return null;
  }

  return (
    <ul className="browser-tree__children" role="group">
      {children}
      <BrowserNavigationOverflowControls
        nodeId={nodeId}
        hiddenCount={hiddenChildrenCount}
        expanded={isChildListExpanded}
        onToggle={onToggleChildList}
      />
    </ul>
  );
}
