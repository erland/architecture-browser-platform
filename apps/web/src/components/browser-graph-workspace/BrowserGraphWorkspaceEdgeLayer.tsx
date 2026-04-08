import type { BrowserWorkspaceEdgeModel } from '../../browser-graph/workspace';
import { resolveRenderedEdgeGeometry } from './BrowserGraphWorkspace.edgeGeometry';

function buildEdgeClassName(edge: BrowserWorkspaceEdgeModel): string {
  const classes = ['browser-canvas__edge'];
  if (edge.semanticStyle === 'containment') {
    classes.push('browser-canvas__edge--containment');
  }
  if (edge.focused) {
    classes.push('browser-canvas__edge--focused');
  }
  return classes.join(' ');
}

function buildEdgeLabelClassName(edge: BrowserWorkspaceEdgeModel): string {
  const classes = ['browser-canvas__edge-label'];
  if (edge.semanticStyle === 'containment') {
    classes.push('browser-canvas__edge-label--containment');
  }
  return classes.join(' ');
}

function buildEndpointLabelClassName(edge: BrowserWorkspaceEdgeModel): string {
  const classes = ['browser-canvas__edge-label', 'browser-canvas__edge-label--endpoint'];
  if (edge.semanticStyle === 'containment') {
    classes.push('browser-canvas__edge-label--containment');
  }
  return classes.join(' ');
}

function BrowserWorkspaceEdge({
  edge,
  onActivateRelationship,
}: {
  edge: BrowserWorkspaceEdgeModel;
  onActivateRelationship: (relationshipId: string) => void;
}) {
  const { path, hitboxPath, labelPosition, fromLabelPosition, toLabelPosition } = resolveRenderedEdgeGeometry(edge);
  if (!path) {
    return null;
  }

  return (
    <g>
      <path d={path} className={buildEdgeClassName(edge)} markerEnd="url(#browser-canvas-arrow)" />
      <path d={hitboxPath} className="browser-canvas__edge-hitbox" onClick={() => onActivateRelationship(edge.relationshipId)} />
      {edge.label ? (
        <text x={labelPosition.x} y={labelPosition.y - 8} className={buildEdgeLabelClassName(edge)} textAnchor="middle">
          {edge.label}
        </text>
      ) : null}
      {edge.fromLabel && fromLabelPosition ? (
        <text x={fromLabelPosition.x} y={fromLabelPosition.y} className={buildEndpointLabelClassName(edge)} textAnchor="middle">
          <title>{`Source multiplicity ${edge.fromLabel}`}</title>
          {edge.fromLabel}
        </text>
      ) : null}
      {edge.toLabel && toLabelPosition ? (
        <text x={toLabelPosition.x} y={toLabelPosition.y} className={buildEndpointLabelClassName(edge)} textAnchor="middle">
          <title>{`Target multiplicity ${edge.toLabel}`}</title>
          {edge.toLabel}
        </text>
      ) : null}
    </g>
  );
}

export function BrowserGraphWorkspaceEdgeLayer({
  edges,
  onActivateRelationship,
}: {
  edges: BrowserWorkspaceEdgeModel[];
  onActivateRelationship: (relationshipId: string) => void;
}) {
  return (
    <>
      {edges.map((edge) => (
        <BrowserWorkspaceEdge key={edge.relationshipId} edge={edge} onActivateRelationship={onActivateRelationship} />
      ))}
    </>
  );
}
