import type { BrowserWorkspaceEdgeModel } from '../browserGraphWorkspaceModel';
import { resolveRenderedEdgeGeometry } from './BrowserGraphWorkspace.edgeGeometry';

function BrowserWorkspaceEdge({
  edge,
  onFocusRelationship,
}: {
  edge: BrowserWorkspaceEdgeModel;
  onFocusRelationship: (relationshipId: string) => void;
}) {
  const { path, hitboxPath, labelPosition } = resolveRenderedEdgeGeometry(edge);
  if (!path) {
    return null;
  }

  return (
    <g>
      <path d={path} className={edge.focused ? 'browser-canvas__edge browser-canvas__edge--focused' : 'browser-canvas__edge'} markerEnd="url(#browser-canvas-arrow)" />
      <path d={hitboxPath} className="browser-canvas__edge-hitbox" onClick={() => onFocusRelationship(edge.relationshipId)} />
      <text x={labelPosition.x} y={labelPosition.y - 8} className="browser-canvas__edge-label" textAnchor="middle">
        {edge.label}
      </text>
    </g>
  );
}

export function BrowserGraphWorkspaceEdgeLayer({
  edges,
  onFocusRelationship,
}: {
  edges: BrowserWorkspaceEdgeModel[];
  onFocusRelationship: (relationshipId: string) => void;
}) {
  return (
    <>
      {edges.map((edge) => (
        <BrowserWorkspaceEdge key={edge.relationshipId} edge={edge} onFocusRelationship={onFocusRelationship} />
      ))}
    </>
  );
}
