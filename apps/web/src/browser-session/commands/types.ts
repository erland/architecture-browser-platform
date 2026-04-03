import type { Dispatch, SetStateAction } from 'react';
import type { BrowserSessionState } from '../model/types';

export type BrowserSessionMutation<Args extends unknown[] = []> = (
  state: BrowserSessionState,
  ...args: Args
) => BrowserSessionState;

export type BrowserSessionMutationGroup = Record<string, BrowserSessionMutation<any[]>>;

export type BoundBrowserSessionMutationGroup<T extends BrowserSessionMutationGroup> = {
  [K in keyof T]: T[K] extends BrowserSessionMutation<infer Args> ? (...args: Args) => void : never;
};

export function applyBrowserSessionMutation<Args extends unknown[]>(
  setState: Dispatch<SetStateAction<BrowserSessionState>>,
  mutation: BrowserSessionMutation<Args>,
  ...args: Args
): void {
  setState((current) => mutation(current, ...args));
}

export function bindBrowserSessionMutationGroup<T extends BrowserSessionMutationGroup>(
  setState: Dispatch<SetStateAction<BrowserSessionState>>,
  mutations: T,
): BoundBrowserSessionMutationGroup<T> {
  const entries = Object.entries(mutations).map(([key, mutation]) => [
    key,
    (...args: unknown[]) => applyBrowserSessionMutation(setState, mutation as BrowserSessionMutation<unknown[]>, ...args),
  ]);
  return Object.fromEntries(entries) as BoundBrowserSessionMutationGroup<T>;
}
