import type { FullSnapshotViewpointAvailability } from './shared';

export type FullSnapshotViewpoint = {
  id: string;
  title: string;
  description: string;
  availability: FullSnapshotViewpointAvailability;
  confidence: number;
  seedEntityIds: string[];
  seedRoleIds: string[];
  expandViaSemantics: string[];
  preferredDependencyViews: string[];
  evidenceSources: string[];
};
