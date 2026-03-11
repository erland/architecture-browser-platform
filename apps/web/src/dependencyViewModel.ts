export type DependencyDirection = "ALL" | "INBOUND" | "OUTBOUND";

export type DependencyEntityOption = {
  externalId: string;
  label: string;
  inScope: boolean;
  inboundCount: number;
  outboundCount: number;
};

export type DependencyRelationshipOption = {
  externalId: string;
  kind: string;
  directionCategory: string;
};

export function toDependencyEntityOptions(
  entities: Array<{
    externalId: string;
    displayName: string | null;
    name: string;
    inScope: boolean;
    inboundCount: number;
    outboundCount: number;
  }>,
): DependencyEntityOption[] {
  return [...entities]
    .sort((left, right) => {
      if (left.inScope !== right.inScope) {
        return left.inScope ? -1 : 1;
      }
      return (left.displayName ?? left.name).localeCompare(right.displayName ?? right.name);
    })
    .map((entity) => ({
      externalId: entity.externalId,
      label: `${entity.displayName ?? entity.name}${entity.inScope ? "" : " (external)"}`,
      inScope: entity.inScope,
      inboundCount: entity.inboundCount,
      outboundCount: entity.outboundCount,
    }));
}

export function summarizeDependencyKinds(relationships: DependencyRelationshipOption[]): string {
  const counts = new Map<string, number>();
  for (const relationship of relationships) {
    counts.set(relationship.kind, (counts.get(relationship.kind) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([kind, count]) => `${kind} (${count})`)
    .join(", ") || "—";
}

export function nextDirection(current: DependencyDirection): DependencyDirection {
  switch (current) {
    case "ALL":
      return "INBOUND";
    case "INBOUND":
      return "OUTBOUND";
    default:
      return "ALL";
  }
}
