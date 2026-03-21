import type { SnapshotSourceRef } from './appModel';

export function collectSourceRefs(...collections: Array<SnapshotSourceRef[] | undefined>) {
  const all = collections.flatMap((items) => items ?? []);
  const seen = new Set<string>();
  const unique: SnapshotSourceRef[] = [];
  for (const item of all) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}
