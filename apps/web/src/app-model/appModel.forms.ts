import type { RepositorySourceType, StubRunResult, TriggerType } from '../app-model/appModel.api';

export const emptyWorkspaceForm = {
  workspaceKey: '',
  name: '',
  description: '',
};

export const emptyRepositoryForm = {
  repositoryKey: '',
  name: '',
  sourceType: 'LOCAL_PATH' as RepositorySourceType,
  localPath: '',
  remoteUrl: '',
  defaultBranch: 'main',
  metadataJson: '',
};

export const initialRunRequest = {
  triggerType: 'MANUAL' as TriggerType,
  requestedSchemaVersion: 'indexer-ir-v1',
  requestedIndexerVersion: 'step4-stub',
  metadataJson: '{"requestedBy":"web-ui"}',
  requestedResult: 'SUCCESS' as StubRunResult,
};
