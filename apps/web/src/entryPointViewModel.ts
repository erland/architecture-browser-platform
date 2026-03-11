export type EntryCategory = "ALL" | "ENTRY_POINT" | "DATA" | "INTEGRATION";

export type EntryPointItemOption = {
  externalId: string;
  label: string;
  kind: string;
  inboundRelationshipCount: number;
  outboundRelationshipCount: number;
};

export function toEntryPointItemOptions(
  items: Array<{
    externalId: string;
    displayName: string | null;
    name: string;
    kind: string;
    inboundRelationshipCount: number;
    outboundRelationshipCount: number;
  }>,
): EntryPointItemOption[] {
  return [...items]
    .sort((left, right) => (left.displayName ?? left.name).localeCompare(right.displayName ?? right.name))
    .map((item) => ({
      externalId: item.externalId,
      label: `${item.displayName ?? item.name} · ${item.kind}`,
      kind: item.kind,
      inboundRelationshipCount: item.inboundRelationshipCount,
      outboundRelationshipCount: item.outboundRelationshipCount,
    }));
}

export function summarizeEntryKinds(items: Array<{ kind: string }>): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([kind, count]) => `${kind} (${count})`)
    .join(", ") || "—";
}
