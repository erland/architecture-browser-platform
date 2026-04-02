import type { KindCount } from '../app-model/appModel.api';
import type { LayoutNode } from './appModel.snapshot';

export function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

export function summarizeCounts(items: KindCount[]) {
  return items.slice(0, 4).map((item) => `${item.key} (${item.count})`).join(', ') || '—';
}

export function containsScope(nodes: LayoutNode[], scopeId: string): boolean {
  return nodes.some((node) => node.externalId === scopeId || containsScope(node.children, scopeId));
}

export function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  for (const node of nodes) {
    result.push(node, ...flattenLayout(node.children));
  }
  return result;
}
