export interface SnapshotListItemViewModel {
  id: string;
  workspaceName: string;
  repositoryName: string;
  createdAt: string;
  outcome: "SUCCESS" | "PARTIAL" | "FAILED";
}

export interface BaselineInfoViewModel {
  repository: string;
  step: string;
  summary: string;
}
