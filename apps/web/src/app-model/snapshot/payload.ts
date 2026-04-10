import type { SnapshotSummary } from '../appModel.api';
import type { FullSnapshotDependencyViews } from './dependencyViews';
import type { FullSnapshotDiagnostic } from './diagnostics';
import type { SnapshotMetadataEnvelope, SnapshotPayloadCompleteness, SnapshotPayloadRun, SnapshotPayloadSource } from './shared';
import type { FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope } from './structure';
import type { FullSnapshotViewpoint } from './viewpoints';

export type FullSnapshotPayload = {
  snapshot: SnapshotSummary;
  source: SnapshotPayloadSource;
  run: SnapshotPayloadRun;
  completeness: SnapshotPayloadCompleteness;
  scopes: FullSnapshotScope[];
  entities: FullSnapshotEntity[];
  relationships: FullSnapshotRelationship[];
  dependencyViews?: FullSnapshotDependencyViews | null;
  viewpoints: FullSnapshotViewpoint[];
  diagnostics: FullSnapshotDiagnostic[];
  metadata: SnapshotMetadataEnvelope;
  warnings: string[];
};
