import {
  moveCanvasNodeInCollection,
  reconcileCanvasNodePositionsInCollection,
  setCanvasEntityClassPresentationModeInCollection,
  toggleCanvasEntityClassPresentationMembersInCollection,
  toggleCanvasNodePinInCollection,
} from '../../browser-session/canvas/canvasNodeTransforms';
import type { BrowserCanvasNode } from '../../browser-session/model/types';

function createCanvasNodes(): BrowserCanvasNode[] {
  return [
    {
      kind: 'entity',
      id: 'entity:browser',
      x: 100,
      y: 120,
      manuallyPlaced: false,
      pinned: false,
      classPresentation: {
        mode: 'simple',
        showFields: false,
        showFunctions: false,
      },
    },
    {
      kind: 'entity',
      id: 'entity:search',
      x: 320,
      y: 120,
      manuallyPlaced: true,
      pinned: true,
      classPresentation: {
        mode: 'compartments',
        showFields: true,
        showFunctions: false,
      },
    },
  ];
}

describe('browser session canvas node transforms', () => {
  test('move/reconcile transforms update node collections without session wiring', () => {
    const moved = moveCanvasNodeInCollection(createCanvasNodes(), { kind: 'entity', id: 'entity:browser' }, { x: 220, y: 260 });
    expect(moved?.find((node) => node.id === 'entity:browser')).toMatchObject({
      x: 220,
      y: 260,
      manuallyPlaced: true,
    });

    const reconciled = reconcileCanvasNodePositionsInCollection(createCanvasNodes(), [
      { kind: 'entity', id: 'entity:search', y: 240 },
    ]);
    expect(reconciled?.find((node) => node.id === 'entity:search')).toMatchObject({
      x: 320,
      y: 240,
      manuallyPlaced: true,
      pinned: true,
    });

    expect(reconcileCanvasNodePositionsInCollection(createCanvasNodes(), [
      { kind: 'entity', id: 'entity:search', x: 320, y: 120 },
    ])).toBeNull();
  });

  test('pin and class presentation transforms stay pure and preserve current behavior', () => {
    const toggledPin = toggleCanvasNodePinInCollection(createCanvasNodes(), { kind: 'entity', id: 'entity:browser' });
    expect(toggledPin.find((node) => node.id === 'entity:browser')).toMatchObject({ pinned: true });

    const modeChanged = setCanvasEntityClassPresentationModeInCollection(createCanvasNodes(), ['entity:browser'], 'compartments');
    expect(modeChanged?.find((node) => node.id === 'entity:browser')).toMatchObject({
      classPresentation: {
        mode: 'compartments',
        showFields: true,
        showFunctions: false,
      },
    });

    const memberToggled = toggleCanvasEntityClassPresentationMembersInCollection(createCanvasNodes(), ['entity:search'], 'functions');
    expect(memberToggled?.find((node) => node.id === 'entity:search')).toMatchObject({
      classPresentation: {
        mode: 'compartments',
        showFields: true,
        showFunctions: true,
      },
    });
  });
});
