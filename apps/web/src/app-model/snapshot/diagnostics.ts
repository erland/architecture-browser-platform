import type { SnapshotSourceRef } from './shared';

export type FullSnapshotDiagnostic = {
  externalId: string;
  severity: string;
  phase: string | null;
  code: string;
  message: string;
  fatal: boolean;
  filePath: string | null;
  scopeId: string | null;
  entityId: string | null;
  sourceRefs: SnapshotSourceRef[];
  metadata: Record<string, unknown>;
};
