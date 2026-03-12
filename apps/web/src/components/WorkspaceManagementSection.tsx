import type { FormEvent, Dispatch, SetStateAction } from 'react';
import type {
  Repository,
  RepositorySourceType,
  RunRecord,
  StubRunResult,
  TriggerType,
  Workspace,
} from '../appModel';
import { WorkspaceDetailsSection } from './WorkspaceDetailsSection';
import { RepositoryManagementSection } from './RepositoryManagementSection';

type WorkspaceEditor = { name: string; description: string };
type RepositoryForm = {
  repositoryKey: string;
  name: string;
  sourceType: RepositorySourceType;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};
type RepositoryEditor = {
  id: string | null;
  name: string;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};
type RunRequestForm = {
  triggerType: TriggerType;
  requestedSchemaVersion: string;
  requestedIndexerVersion: string;
  metadataJson: string;
  requestedResult: StubRunResult;
};

type WorkspaceManagementSectionProps = {
  selectedWorkspace: Workspace | null;
  workspaceEditor: WorkspaceEditor;
  setWorkspaceEditor: Dispatch<SetStateAction<WorkspaceEditor>>;
  handleUpdateWorkspace: (event: FormEvent) => Promise<void>;
  handleArchiveWorkspace: () => Promise<void>;
  repositories: Repository[];
  repositoryForm: RepositoryForm;
  setRepositoryForm: Dispatch<SetStateAction<RepositoryForm>>;
  handleCreateRepository: (event: FormEvent) => Promise<void>;
  repositoryEditor: RepositoryEditor;
  setRepositoryEditor: Dispatch<SetStateAction<RepositoryEditor>>;
  handleUpdateRepository: (event: FormEvent) => Promise<void>;
  runRequestForm: RunRequestForm;
  setRunRequestForm: Dispatch<SetStateAction<RunRequestForm>>;
  latestRunByRepository: Map<string, RunRecord>;
  selectRepositoryForEdit: (repository: Repository) => void;
  handleRequestRun: (repository: Repository, requestedResult: StubRunResult) => Promise<void>;
  handleArchiveRepository: (repositoryId: string) => Promise<void>;
};

export function WorkspaceManagementSection(props: WorkspaceManagementSectionProps) {
  return (
    <>
      <WorkspaceDetailsSection
        selectedWorkspace={props.selectedWorkspace}
        workspaceEditor={props.workspaceEditor}
        setWorkspaceEditor={props.setWorkspaceEditor}
        handleUpdateWorkspace={props.handleUpdateWorkspace}
        handleArchiveWorkspace={props.handleArchiveWorkspace}
      />

      <RepositoryManagementSection
        selectedWorkspace={props.selectedWorkspace}
        repositories={props.repositories}
        repositoryForm={props.repositoryForm}
        setRepositoryForm={props.setRepositoryForm}
        handleCreateRepository={props.handleCreateRepository}
        repositoryEditor={props.repositoryEditor}
        setRepositoryEditor={props.setRepositoryEditor}
        handleUpdateRepository={props.handleUpdateRepository}
        runRequestForm={props.runRequestForm}
        setRunRequestForm={props.setRunRequestForm}
        latestRunByRepository={props.latestRunByRepository}
        selectRepositoryForEdit={props.selectRepositoryForEdit}
        handleRequestRun={props.handleRequestRun}
        handleArchiveRepository={props.handleArchiveRepository}
      />
    </>
  );
}
