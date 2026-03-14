import {
  clampCanvasZoom,
  computeDraggedCanvasNodePosition,
  computeFitViewCanvasViewport,
  computePannedCanvasViewport,
  computeZoomedCanvasViewportAroundPointer,
} from '../browserCanvasViewport';

describe('browserCanvasViewport', () => {
  test('clamps zoom to supported browser canvas bounds', () => {
    expect(clampCanvasZoom(0.1)).toBe(0.35);
    expect(clampCanvasZoom(1.1)).toBe(1.1);
    expect(clampCanvasZoom(5)).toBe(2.2);
  });

  test('converts dragged screen movement into canvas-space node movement', () => {
    expect(computeDraggedCanvasNodePosition({ x: 300, y: 180 }, { x: 120, y: -60 }, 2)).toEqual({ x: 360, y: 150 });
    expect(computeDraggedCanvasNodePosition({ x: 300, y: 180 }, { x: 120, y: -60 }, 0.5)).toEqual({ x: 540, y: 60 });
  });

  test('pans viewport offsets directly in screen space', () => {
    expect(computePannedCanvasViewport({ zoom: 1.25, offsetX: 40, offsetY: 12 }, { x: -18, y: 48 })).toEqual({
      zoom: 1.25,
      offsetX: 22,
      offsetY: 60,
    });
  });

  test('zooms around the pointer while keeping the same world point under the cursor', () => {
    const initial = { zoom: 1, offsetX: 24, offsetY: 16 };
    const pointer = { x: 300, y: 200 };
    const zoomedIn = computeZoomedCanvasViewportAroundPointer(initial, pointer, -100);

    const worldXBefore = (pointer.x - initial.offsetX) / initial.zoom;
    const worldYBefore = (pointer.y - initial.offsetY) / initial.zoom;
    const worldXAfter = (pointer.x - zoomedIn.offsetX) / zoomedIn.zoom;
    const worldYAfter = (pointer.y - zoomedIn.offsetY) / zoomedIn.zoom;

    expect(zoomedIn.zoom).toBeCloseTo(1.08, 5);
    expect(worldXAfter).toBeCloseTo(worldXBefore, 5);
    expect(worldYAfter).toBeCloseTo(worldYBefore, 5);
  });

  test('fit view centers the content and respects min and max zoom bounds', () => {
    const fitted = computeFitViewCanvasViewport({ width: 1200, height: 800 }, { width: 900, height: 700 });
    expect(fitted.zoom).toBeCloseTo(1.097143, 5);
    expect(fitted.offsetX).toBeGreaterThanOrEqual(100);
    expect(fitted.offsetY).toBeGreaterThanOrEqual(10);

    const clampedSmall = computeFitViewCanvasViewport({ width: 2200, height: 1400 }, { width: 300, height: 200 });
    expect(clampedSmall.zoom).toBe(1.4);

    const clampedLarge = computeFitViewCanvasViewport({ width: 400, height: 260 }, { width: 4000, height: 3000 });
    expect(clampedLarge.zoom).toBe(0.35);
  });
});
