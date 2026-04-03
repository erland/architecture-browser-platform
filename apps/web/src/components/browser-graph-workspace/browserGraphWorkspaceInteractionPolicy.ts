import type { DragState, PanState } from './BrowserGraphWorkspace.types';

export const DRAG_THRESHOLD_PX = 6;
export const PAN_THRESHOLD_PX = 3;

export function isPrimaryPointerButton(button: number): boolean {
  return button === 0;
}

export function shouldIgnoreViewportPanTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.browser-canvas__node, .browser-canvas__edge-hitbox'));
}

export function computePointerTravel(startClientX: number, startClientY: number, clientX: number, clientY: number): number {
  return Math.max(Math.abs(clientX - startClientX), Math.abs(clientY - startClientY));
}

export function hasExceededDragThreshold(dragState: DragState, clientX: number, clientY: number): boolean {
  return computePointerTravel(dragState.startClientX, dragState.startClientY, clientX, clientY) > DRAG_THRESHOLD_PX;
}

export function hasExceededPanThreshold(panState: PanState, clientX: number, clientY: number): boolean {
  return computePointerTravel(panState.startClientX, panState.startClientY, clientX, clientY) > PAN_THRESHOLD_PX;
}

export function shouldWheelPan(event: Pick<WheelEvent, 'ctrlKey' | 'metaKey'> | Pick<React.WheelEvent<HTMLDivElement>, 'ctrlKey' | 'metaKey'>): boolean {
  return !event.ctrlKey && !event.metaKey;
}
