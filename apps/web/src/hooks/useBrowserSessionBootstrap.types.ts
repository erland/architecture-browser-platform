import type { BrowserSessionState } from '../browser-session/session-state-types';

export type BrowserSessionBootstrapStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type BrowserSessionBootstrapOutcome = {
  status: BrowserSessionBootstrapStatus;
  message: string | null;
  opened: boolean;
};

export type BrowserSessionBootstrapReplaceState = (nextState: BrowserSessionState) => void;
