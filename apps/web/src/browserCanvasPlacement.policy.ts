// Placement policy helpers for browser canvas node positioning.
//
// This module centralizes spacing constants and small math helpers used by
// browser canvas placement algorithms. The algorithms themselves remain in
// browserCanvasPlacement.ts.

export const GRID_X = 224;
export const GRID_Y = 120;
export const COLLISION_MARGIN = 24;
export const APPEND_CLUSTER_GAP = 96;
export const RADIAL_RADIUS = 220;
export const PEER_SPACING_X = 224;
export const PEER_SPACING_Y = 116;
export const CONTAINED_OFFSET_X = 44;
export const CONTAINED_OFFSET_Y = 108;

export function roundToGrid(value: number, spacing: number): number {
  return Math.round(value / spacing) * spacing;
}
