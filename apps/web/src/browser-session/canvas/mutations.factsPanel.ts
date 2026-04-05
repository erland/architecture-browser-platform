import type {
  BrowserFactsPanelLocation,
  BrowserFactsPanelMode,
  BrowserSessionState,
} from '../model/types';

export function openFactsPanel(state: BrowserSessionState, mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation): BrowserSessionState {
  return {
    ...state,
    factsPanelMode: mode,
    factsPanelLocation: location ?? state.factsPanelLocation,
  };
}
