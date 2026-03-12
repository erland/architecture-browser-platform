import { FormEvent, useEffect, useMemo, useState } from "react";
import { platformApi } from "../platformApi";
import {
  ApiHealth,
  AuditEvent,
  OperationsOverview,
  Repository,
  RetentionPreview,
  RunRecord,
  SnapshotSummary,
  StubRunResult,
  Workspace,
  emptyRepositoryForm,
  emptyWorkspaceForm,
  initialHealth,
  initialOperationsOverview,
  initialRetentionPreview,
  initialRunRequest,
} from "../appModel";
import { normalizeRetentionForm } from "../operationsViewModel";

type WorkspaceEditor = { name: string; description: string };
type RepositoryEditor = {
  id: string | null;
  name: string;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};
type RetentionForm = { keepSnapshotsPerRepository: string; keepRunsPerRepository: string };

type FeedbackSetters = {
  setBusyMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

function emptyRepositoryEditor(): RepositoryEditor {
  return {
    id: null,
    name: "",
    localPath: "",
    remoteUrl: "",
    defaultBranch: "main",
    metadataJson: "",
  };
}

export function useWorkspaceData({ setBusyMessage, setError }: FeedbackSetters) {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [operationsOverview, setOperationsOverview] = useState<OperationsOverview | null>(initialOperationsOverview);
  const [retentionPreview, setRetentionPreview] = useState<RetentionPreview | null>(initialRetentionPreview);
  const [retentionForm, setRetentionForm] = useState<RetentionForm>({ keepSnapshotsPerRepository: "2", keepRunsPerRepository: "5" });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceForm, setWorkspaceForm] = useState(emptyWorkspaceForm);
  const [workspaceEditor, setWorkspaceEditor] = useState<WorkspaceEditor>({ name: "", description: "" });
  const [repositoryForm, setRepositoryForm] = useState(emptyRepositoryForm);
  const [repositoryEditor, setRepositoryEditor] = useState<RepositoryEditor>(emptyRepositoryEditor);
  const [runRequestForm, setRunRequestForm] = useState(initialRunRequest);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const latestRunByRepository = useMemo(() => {
    const result = new Map<string, RunRecord>();
    for (const run of recentRuns) {
      if (!result.has(run.repositoryRegistrationId)) {
        result.set(run.repositoryRegistrationId, run);
      }
    }
    return result;
  }, [recentRuns]);

  useEffect(() => {
    void loadHealth();
    void loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      setWorkspaceEditor({
        name: selectedWorkspace.name,
        description: selectedWorkspace.description ?? "",
      });
      void loadWorkspaceDetail(selectedWorkspace.id);
      return;
    }

    setRepositories([]);
    setAuditEvents([]);
    setRecentRuns([]);
    setSnapshots([]);
    setOperationsOverview(null);
    setRetentionPreview(null);
    setRetentionForm({ keepSnapshotsPerRepository: "2", keepRunsPerRepository: "5" });
    setWorkspaceEditor({ name: "", description: "" });
    setRepositoryEditor(emptyRepositoryEditor());
  }, [selectedWorkspace]);

  async function loadHealth() {
    try {
      const payload = await platformApi.getHealth<ApiHealth>();
      setHealth(payload);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadWorkspaces() {
    try {
      const payload = await platformApi.listWorkspaces<Workspace[]>();
      setWorkspaces(payload);
      setSelectedWorkspaceId((current) => {
        if (current && payload.some((item) => item.id === current)) {
          return current;
        }
        return payload[0]?.id ?? null;
      });
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function loadWorkspaceDetail(workspaceId: string) {
    try {
      const [repositoryPayload, auditPayload, runPayload, snapshotPayload, operationsPayload] = await Promise.all([
        platformApi.getWorkspaceRepositories<Repository[]>(workspaceId),
        platformApi.getWorkspaceAuditEvents<AuditEvent[]>(workspaceId),
        platformApi.getWorkspaceRuns<RunRecord[]>(workspaceId),
        platformApi.getWorkspaceSnapshots<SnapshotSummary[]>(workspaceId),
        platformApi.getOperationsOverview<OperationsOverview>(workspaceId),
      ]);
      setRepositories(repositoryPayload);
      setAuditEvents(auditPayload);
      setRecentRuns(runPayload);
      setSnapshots(snapshotPayload);
      setOperationsOverview(operationsPayload);
      setRetentionForm({
        keepSnapshotsPerRepository: `${operationsPayload.retentionDefaults.keepSnapshotsPerRepository}`,
        keepRunsPerRepository: `${operationsPayload.retentionDefaults.keepRunsPerRepository}`,
      });
      setRepositoryEditor((current) => (current.id ? current : emptyRepositoryEditor()));
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  async function handlePreviewRetention(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) return;
    setBusyMessage("Previewing retention…");
    try {
      const normalized = normalizeRetentionForm(retentionForm, operationsOverview?.retentionDefaults ?? { keepSnapshotsPerRepository: 2, keepRunsPerRepository: 5 });
      const payload = await platformApi.previewRetention<RetentionPreview>(selectedWorkspaceId, normalized);
      setRetentionPreview(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleApplyRetention() {
    if (!selectedWorkspaceId) return;
    setBusyMessage("Applying retention…");
    try {
      const normalized = normalizeRetentionForm(retentionForm, operationsOverview?.retentionDefaults ?? { keepSnapshotsPerRepository: 2, keepRunsPerRepository: 5 });
      const payload = await platformApi.applyRetention<RetentionPreview>(selectedWorkspaceId, normalized);
      setRetentionPreview(payload);
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateWorkspace(event: FormEvent) {
    event.preventDefault();
    setBusyMessage("Creating workspace…");
    try {
      const created = await platformApi.createWorkspace<Workspace>(workspaceForm);
      setWorkspaceForm(emptyWorkspaceForm);
      await loadWorkspaces();
      setSelectedWorkspaceId(created.id);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) return;
    setBusyMessage("Updating workspace…");
    try {
      const updated = await platformApi.updateWorkspace<Workspace>(selectedWorkspaceId, workspaceEditor);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
      await loadWorkspaceDetail(selectedWorkspaceId);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveWorkspace() {
    if (!selectedWorkspaceId) return;
    setBusyMessage("Archiving workspace…");
    try {
      const updated = await platformApi.archiveWorkspace<Workspace>(selectedWorkspaceId);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) return;
    setBusyMessage("Creating repository registration…");
    try {
      await platformApi.createRepository<Repository>(selectedWorkspaceId, repositoryForm);
      setRepositoryForm(emptyRepositoryForm);
      await loadWorkspaces();
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !repositoryEditor.id) return;
    setBusyMessage("Updating repository registration…");
    try {
      await platformApi.updateRepository<Repository>(selectedWorkspaceId, repositoryEditor.id, {
        name: repositoryEditor.name,
        localPath: repositoryEditor.localPath,
        remoteUrl: repositoryEditor.remoteUrl,
        defaultBranch: repositoryEditor.defaultBranch,
        metadataJson: repositoryEditor.metadataJson,
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveRepository(repositoryId: string) {
    if (!selectedWorkspaceId) return;
    setBusyMessage("Archiving repository registration…");
    try {
      await platformApi.archiveRepository<Repository>(selectedWorkspaceId, repositoryId);
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleRequestRun(repository: Repository, requestedResult: StubRunResult) {
    if (!selectedWorkspaceId) return;
    setBusyMessage(`Requesting ${requestedResult.toLowerCase()} run for ${repository.name}…`);
    try {
      await platformApi.requestRun<RunRecord>(selectedWorkspaceId, repository.id, {
        ...runRequestForm,
        requestedResult,
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  function selectRepositoryForEdit(repository: Repository) {
    setRepositoryEditor({
      id: repository.id,
      name: repository.name,
      localPath: repository.localPath ?? "",
      remoteUrl: repository.remoteUrl ?? "",
      defaultBranch: repository.defaultBranch ?? "",
      metadataJson: repository.metadataJson ?? "",
    });
  }

  return {
    health,
    workspaces,
    repositories,
    auditEvents,
    recentRuns,
    snapshots,
    operationsOverview,
    retentionPreview,
    retentionForm,
    setRetentionForm,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    selectedWorkspace,
    workspaceForm,
    setWorkspaceForm,
    workspaceEditor,
    setWorkspaceEditor,
    repositoryForm,
    setRepositoryForm,
    repositoryEditor,
    setRepositoryEditor,
    runRequestForm,
    setRunRequestForm,
    latestRunByRepository,
    loadWorkspaceDetail,
    handlePreviewRetention,
    handleApplyRetention,
    handleCreateWorkspace,
    handleUpdateWorkspace,
    handleArchiveWorkspace,
    handleCreateRepository,
    handleUpdateRepository,
    handleArchiveRepository,
    handleRequestRun,
    selectRepositoryForEdit,
  };
}
