import type { Dispatch, SetStateAction } from 'react';
import { createBoundBrowserSessionActionGroups } from '../browser-session/commands-api';
import type { BrowserSessionState } from '../browser-session/types';
import type { BrowserSessionActionGroups } from './browserSession.types';

export function createBrowserSessionActionGroups(
  setState: Dispatch<SetStateAction<BrowserSessionState>>,
): BrowserSessionActionGroups {
  return createBoundBrowserSessionActionGroups(setState);
}
