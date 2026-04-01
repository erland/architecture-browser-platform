import type { BrowserEdgeRoutingInput, BrowserRoutingPoint } from './types';
import { buildOrthogonalAutoPolyline, preferredAxisFromSide } from './routingCandidates';
import { adjustOrthogonalConnectionEndpoints } from './routingEndpoints';
import { buildLabelPosition, buildPath } from './routingPresentation';

export type BrowserRoutingAxis = 'h' | 'v';

export type BrowserOrthogonalRoutingHints = {
  preferStartAxis?: BrowserRoutingAxis;
  preferEndAxis?: BrowserRoutingAxis;
  gridSize?: number;
  laneOffset?: number;
  laneSpacing?: number;
  maxChannelShiftSteps?: number;
  obstacleMargin?: number;
};

export type BrowserEdgeRouteBuildOptions = {
  orthogonalRouting?: boolean;
  laneOffset?: number;
  laneSpacing?: number;
  gridSize?: number;
  obstacleMargin?: number;
  maxChannelShiftSteps?: number;
  endpointStubLength?: number;
};

type BrowserBuiltEdgeRoute = {
  kind: 'straight' | 'polyline';
  points: BrowserRoutingPoint[];
  path: string;
  labelPosition: BrowserRoutingPoint;
};

export function buildBrowserEdgeRoute(input: BrowserEdgeRoutingInput, options?: BrowserEdgeRouteBuildOptions): BrowserBuiltEdgeRoute {
  const useOrthogonalRouting = options?.orthogonalRouting ?? true;
  const rawPoints = useOrthogonalRouting
    ? buildOrthogonalAutoPolyline(input, {
        preferStartAxis: preferredAxisFromSide(input.preferredStartSide),
        preferEndAxis: preferredAxisFromSide(input.preferredEndSide),
        gridSize: options?.gridSize ?? 20,
        laneOffset: options?.laneOffset,
        laneSpacing: options?.laneSpacing ?? 16,
        obstacleMargin: options?.obstacleMargin ?? 10,
        maxChannelShiftSteps: options?.maxChannelShiftSteps ?? 12,
      })
    : [input.defaultStart, input.defaultEnd];
  const points = useOrthogonalRouting
    ? adjustOrthogonalConnectionEndpoints(rawPoints, input, { stubLength: options?.endpointStubLength ?? 10 })
    : rawPoints;

  return {
    kind: points.length > 2 ? 'polyline' : 'straight',
    points,
    path: buildPath(points),
    labelPosition: buildLabelPosition(points),
  };
}
