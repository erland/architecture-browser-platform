import type { Dispatch, SetStateAction } from 'react';
import {
  createBoundBrowserSessionActionGroups,
  type BrowserSessionState,
} from '../browser-session';
import type { BrowserSessionActionGroups } from './browserSession.types';

export function createBrowserSessionActionGroups(
  setState: Dispatch<SetStateAction<BrowserSessionState>>,
): BrowserSessionActionGroups {
  return createBoundBrowserSessionActionGroups(setState);
}
