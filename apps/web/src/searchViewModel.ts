export type SearchResultOption = {
  externalId: string;
  label: string;
  scopePath: string;
  kind: string;
};

export function toSearchResultOptions(
  results: Array<{
    externalId: string;
    displayName: string | null;
    name: string;
    scopePath: string;
    kind: string;
  }>,
): SearchResultOption[] {
  return [...results]
    .sort((left, right) => {
      const labelCompare = (left.displayName ?? left.name).localeCompare(right.displayName ?? right.name);
      if (labelCompare !== 0) {
        return labelCompare;
      }
      const scopeCompare = left.scopePath.localeCompare(right.scopePath);
      if (scopeCompare !== 0) {
        return scopeCompare;
      }
      return left.kind.localeCompare(right.kind);
    })
    .map((result) => ({
      externalId: result.externalId,
      label: `${result.displayName ?? result.name} · ${result.scopePath}`,
      scopePath: result.scopePath,
      kind: result.kind,
    }));
}

export function summarizeMatchReasons(reasons: string[]): string {
  return reasons.join(", ") || "—";
}
