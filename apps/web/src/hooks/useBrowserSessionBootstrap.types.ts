import type { BrowserSessionState } from '../browser-session';

export type BrowserSessionBootstrapStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type BrowserSessionBootstrapOutcome = {
  status: BrowserSessionBootstrapStatus;
  message: string | null;
  opened: boolean;
};

export type BrowserSessionBootstrapReplaceState = (nextState: BrowserSessionState) => void;
