import { FormEvent, useEffect, useMemo, useState } from "react";
import { toDependencyEntityOptions } from "./dependencyViewModel";
import { toEntryPointItemOptions } from "./entryPointViewModel";
import { toSearchResultOptions } from "./searchViewModel";
import { buildSavedViewRequest, parseSavedViewJson } from "./savedViewModel";
import { comparisonSnapshotOptions } from "./compareViewModel";
import { normalizeRetentionForm } from "./operationsViewModel";
import { platformApi } from "./platformApi";
import {
  ApiHealth,
  AuditEvent,
  CustomizationOverview,
  DependencyDirection,
  DependencyView,
  EntityDetail,
  EntryCategory,
  EntryPointView,
  LayoutScopeDetail,
  LayoutTree,
  OperationsOverview,
  OverlayKind,
  OverlayRecord,
  Repository,
  RetentionPreview,
  RunRecord,
  SavedViewRecord,
  SearchView,
  SnapshotComparison,
  SnapshotOverview,
  SnapshotSummary,
  StubRunResult,
  Workspace,
  containsScope,
  emptyRepositoryForm,
  emptyWorkspaceForm,
  flattenLayout,
  initialHealth,
  initialOperationsOverview,
  initialRetentionPreview,
  initialRunRequest,
} from "./appModel";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar";
import { WorkspaceManagementSection } from "./components/WorkspaceManagementSection";
import { SnapshotCatalogSection } from "./components/SnapshotCatalogSection";
import { OperationsAndAuditSection } from "./components/OperationsAndAuditSection";

export function App() {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [snapshotOverview, setSnapshotOverview] = useState<SnapshotOverview | null>(null);
  const [layoutTree, setLayoutTree] = useState<LayoutTree | null>(null);
  const [selectedLayoutScopeId, setSelectedLayoutScopeId] = useState<string | null>(null);
  const [layoutScopeDetail, setLayoutScopeDetail] = useState<LayoutScopeDetail | null>(null);
  const [dependencyView, setDependencyView] = useState<DependencyView | null>(null);
  const [selectedDependencyScopeId, setSelectedDependencyScopeId] = useState<string>("");
  const [dependencyDirection, setDependencyDirection] = useState<DependencyDirection>("ALL");
  const [focusedDependencyEntityId, setFocusedDependencyEntityId] = useState<string>("");
  const [entryPointView, setEntryPointView] = useState<EntryPointView | null>(null);
  const [selectedEntryPointScopeId, setSelectedEntryPointScopeId] = useState<string>("");
  const [entryCategory, setEntryCategory] = useState<EntryCategory>("ALL");
  const [focusedEntryPointId, setFocusedEntryPointId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSearchScopeId, setSelectedSearchScopeId] = useState<string>("");
  const [searchView, setSearchView] = useState<SearchView | null>(null);
  const [selectedSearchEntityId, setSelectedSearchEntityId] = useState<string>("");
  const [entityDetail, setEntityDetail] = useState<EntityDetail | null>(null);
  const [customizationOverview, setCustomizationOverview] = useState<CustomizationOverview | null>(null);
  const [overlayName, setOverlayName] = useState<string>("");
  const [overlayKind, setOverlayKind] = useState<OverlayKind>("ANNOTATION");
  const [overlayNote, setOverlayNote] = useState<string>("");
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>("");
  const [savedViewName, setSavedViewName] = useState<string>("");
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>("");
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string>("");
  const [snapshotComparison, setSnapshotComparison] = useState<SnapshotComparison | null>(null);
  const [operationsOverview, setOperationsOverview] = useState<OperationsOverview | null>(initialOperationsOverview);
  const [retentionPreview, setRetentionPreview] = useState<RetentionPreview | null>(initialRetentionPreview);
  const [retentionForm, setRetentionForm] = useState<{ keepSnapshotsPerRepository: string; keepRunsPerRepository: string }>({ keepSnapshotsPerRepository: "2", keepRunsPerRepository: "5" });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceForm, setWorkspaceForm] = useState(emptyWorkspaceForm);
  const [repositoryForm, setRepositoryForm] = useState(emptyRepositoryForm);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceEditor, setWorkspaceEditor] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [repositoryEditor, setRepositoryEditor] = useState<{ id: string | null; name: string; localPath: string; remoteUrl: string; defaultBranch: string; metadataJson: string }>({
    id: null,
    name: "",
    localPath: "",
    remoteUrl: "",
    defaultBranch: "main",
    metadataJson: "",
  });
  const [runRequestForm, setRunRequestForm] = useState(initialRunRequest);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const flattenedLayoutNodes = useMemo(() => flattenLayout(layoutTree?.roots ?? []), [layoutTree]);

  const dependencyEntityOptions = useMemo(() => toDependencyEntityOptions(dependencyView?.entities ?? []), [dependencyView]);
  const entryPointOptions = useMemo(() => toEntryPointItemOptions(entryPointView?.items ?? []), [entryPointView]);
  const searchResultOptions = useMemo(() => toSearchResultOptions(searchView?.results ?? []), [searchView]);

  const comparisonOptions = useMemo(() => comparisonSnapshotOptions(snapshots, selectedSnapshotId), [snapshots, selectedSnapshotId]);

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
    } else {
      setRepositories([]);
      setAuditEvents([]);
      setRecentRuns([]);
      setSnapshots([]);
      setSelectedSnapshotId(null);
      setSnapshotOverview(null);
      setLayoutTree(null);
      setSelectedLayoutScopeId(null);
      setLayoutScopeDetail(null);
      setDependencyView(null);
      setSelectedDependencyScopeId("");
      setDependencyDirection("ALL");
      setFocusedDependencyEntityId("");
      setEntryPointView(null);
      setSelectedEntryPointScopeId("");
      setEntryCategory("ALL");
      setFocusedEntryPointId("");
      setSearchQuery("");
      setSelectedSearchScopeId("");
      setSearchView(null);
      setSelectedSearchEntityId("");
      setEntityDetail(null);
      setCustomizationOverview(null);
      setOverlayName("");
      setOverlayKind("ANNOTATION");
      setOverlayNote("");
      setSelectedOverlayId("");
      setSavedViewName("");
      setSelectedSavedViewId("");
      setComparisonSnapshotId("");
      setSnapshotComparison(null);
      setOperationsOverview(null);
      setRetentionPreview(null);
      setRetentionForm({ keepSnapshotsPerRepository: "2", keepRunsPerRepository: "5" });
      setWorkspaceEditor({ name: "", description: "" });
      setRepositoryEditor({ id: null, name: "", localPath: "", remoteUrl: "", defaultBranch: "main", metadataJson: "" });
    }
  }, [selectedWorkspaceId, selectedWorkspace]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadSnapshotOverview(selectedWorkspaceId, selectedSnapshotId);
      void loadLayoutTree(selectedWorkspaceId, selectedSnapshotId);
      void loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
    } else {
      setSnapshotOverview(null);
      setLayoutTree(null);
      setSelectedLayoutScopeId(null);
      setLayoutScopeDetail(null);
      setDependencyView(null);
      setSelectedDependencyScopeId("");
      setFocusedDependencyEntityId("");
      setEntryPointView(null);
      setSelectedEntryPointScopeId("");
      setFocusedEntryPointId("");
      setSearchQuery("");
      setSelectedSearchScopeId("");
      setSearchView(null);
      setSelectedSearchEntityId("");
      setEntityDetail(null);
      setCustomizationOverview(null);
      setOverlayName("");
      setOverlayKind("ANNOTATION");
      setOverlayNote("");
      setSelectedOverlayId("");
      setSavedViewName("");
      setSelectedSavedViewId("");
      setComparisonSnapshotId("");
      setSnapshotComparison(null);
      setOperationsOverview(null);
      setRetentionPreview(null);
      setRetentionForm({ keepSnapshotsPerRepository: "2", keepRunsPerRepository: "5" });
    }
  }, [selectedWorkspaceId, selectedSnapshotId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && selectedLayoutScopeId) {
      void loadLayoutScopeDetail(selectedWorkspaceId, selectedSnapshotId, selectedLayoutScopeId);
    } else {
      setLayoutScopeDetail(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedLayoutScopeId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadDependencyView(selectedWorkspaceId, selectedSnapshotId, selectedDependencyScopeId || undefined, dependencyDirection, focusedDependencyEntityId || undefined);
    } else {
      setDependencyView(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedDependencyScopeId, dependencyDirection, focusedDependencyEntityId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadEntryPointView(selectedWorkspaceId, selectedSnapshotId, selectedEntryPointScopeId || undefined, entryCategory, focusedEntryPointId || undefined);
    } else {
      setEntryPointView(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedEntryPointScopeId, entryCategory, focusedEntryPointId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadSearchView(selectedWorkspaceId, selectedSnapshotId, searchQuery, selectedSearchScopeId || undefined);
    } else {
      setSearchView(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, searchQuery, selectedSearchScopeId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && selectedSearchEntityId) {
      void loadEntityDetail(selectedWorkspaceId, selectedSnapshotId, selectedSearchEntityId);
    } else {
      setEntityDetail(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedSearchEntityId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && comparisonSnapshotId) {
      void loadSnapshotComparison(selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId);
    } else {
      setSnapshotComparison(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId]);

  async function loadHealth() {
    try {
      const payload = await platformApi.getHealth<ApiHealth>();
      setHealth(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
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
      setError(caught instanceof Error ? caught.message : "Unknown error");
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
      setSelectedSnapshotId((current) => current && snapshotPayload.some((item) => item.id === current) ? current : (snapshotPayload[0]?.id ?? null));
      setOperationsOverview(operationsPayload);
      setRetentionForm({
        keepSnapshotsPerRepository: `${operationsPayload.retentionDefaults.keepSnapshotsPerRepository}`,
        keepRunsPerRepository: `${operationsPayload.retentionDefaults.keepRunsPerRepository}`,
      });
      setRepositoryEditor((current) => current.id ? current : {
        id: null,
        name: "",
        localPath: "",
        remoteUrl: "",
        defaultBranch: "main",
        metadataJson: "",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadSnapshotOverview(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getSnapshotOverview<SnapshotOverview>(workspaceId, snapshotId);
      setSnapshotOverview(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadLayoutTree(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getLayoutTree<LayoutTree>(workspaceId, snapshotId);
      setLayoutTree(payload);
      const firstScope = payload.roots[0]?.externalId ?? null;
      setSelectedLayoutScopeId((current) => current && containsScope(payload.roots, current) ? current : firstScope);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadLayoutScopeDetail(workspaceId: string, snapshotId: string, scopeId: string) {
    try {
      const payload = await platformApi.getLayoutScopeDetail<LayoutScopeDetail>(workspaceId, snapshotId, scopeId);
      setLayoutScopeDetail(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadDependencyView(workspaceId: string, snapshotId: string, scopeId?: string, direction: DependencyDirection = "ALL", focusEntityId?: string) {
    try {
      const payload = await platformApi.getDependencyView<DependencyView>(workspaceId, snapshotId, direction, scopeId, focusEntityId);
      setDependencyView(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadEntryPointView(workspaceId: string, snapshotId: string, scopeId?: string, category: EntryCategory = "ALL", focusEntityId?: string) {
    try {
      const payload = await platformApi.getEntryPointView<EntryPointView>(workspaceId, snapshotId, category, scopeId, focusEntityId);
      setEntryPointView(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }


  async function loadSearchView(workspaceId: string, snapshotId: string, queryText: string, scopeId?: string) {
    try {
      const payload = await platformApi.searchSnapshot<SearchView>(workspaceId, snapshotId, queryText, scopeId, 25);
      setSearchView(payload);
      setSelectedSearchEntityId((current) => current && payload.results.some((result) => result.externalId === current) ? current : "");
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadEntityDetail(workspaceId: string, snapshotId: string, entityId: string) {
    try {
      const payload = await platformApi.getEntityDetail<EntityDetail>(workspaceId, snapshotId, entityId);
      setEntityDetail(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadCustomizationOverview(workspaceId: string, snapshotId: string) {
    try {
      const payload = await platformApi.getCustomizationOverview<CustomizationOverview>(workspaceId, snapshotId);
      setCustomizationOverview(payload);
      setSelectedOverlayId((current) => current && payload.overlays.some((item) => item.id === current) ? current : "");
      setSelectedSavedViewId((current) => current && payload.savedViews.some((item) => item.id === current) ? current : "");
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadSnapshotComparison(workspaceId: string, snapshotId: string, otherSnapshotId: string) {
    try {
      const payload = await platformApi.getSnapshotComparison<SnapshotComparison>(workspaceId, snapshotId, otherSnapshotId);
      setSnapshotComparison(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
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
      setError(caught instanceof Error ? caught.message : "Unknown error");
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
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateOverlay(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Creating overlay…");
    try {
      const targetEntityIds = selectedSearchEntityId ? [selectedSearchEntityId] : [];
      const targetScopeIds = selectedSearchScopeId ? [selectedSearchScopeId] : (selectedLayoutScopeId ? [selectedLayoutScopeId] : []);
      await platformApi.createOverlay<OverlayRecord>(selectedWorkspaceId, selectedSnapshotId, {
        name: overlayName,
        kind: overlayKind,
        targetEntityIds,
        targetScopeIds,
        note: overlayNote,
        attributes: {},
      });
      setOverlayName("");
      setOverlayNote("");
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteOverlay(overlayId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Deleting overlay…");
    try {
      await platformApi.deleteOverlay(selectedWorkspaceId, selectedSnapshotId, overlayId);
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleSaveCurrentView(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Saving view…");
    try {
      await platformApi.createSavedView<SavedViewRecord>(
        selectedWorkspaceId,
        selectedSnapshotId,
        buildSavedViewRequest(savedViewName, {
          selectedSearchScopeId,
          searchQuery,
          selectedSearchEntityId,
          selectedLayoutScopeId: selectedLayoutScopeId ?? "",
          selectedDependencyScopeId,
          dependencyDirection,
          focusedDependencyEntityId,
          selectedEntryPointScopeId,
          entryCategory,
          focusedEntryPointId,
        }),
      );
      setSavedViewName("");
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleApplySavedView(savedViewId: string) {
    const savedView = customizationOverview?.savedViews.find((item) => item.id === savedViewId);
    if (!savedView) return;
    const queryState = parseSavedViewJson<Record<string, string>>(savedView.queryJson) ?? {};
    const layoutState = parseSavedViewJson<Record<string, string>>(savedView.layoutJson) ?? {};
    setSelectedSearchScopeId(queryState.selectedSearchScopeId ?? "");
    setSearchQuery(queryState.searchQuery ?? "");
    setSelectedSearchEntityId(queryState.selectedSearchEntityId ?? "");
    setSelectedEntryPointScopeId(queryState.selectedEntryPointScopeId ?? "");
    setEntryCategory((queryState.entryCategory as EntryCategory | undefined) ?? "ALL");
    setFocusedEntryPointId(queryState.focusedEntryPointId ?? "");
    setSelectedLayoutScopeId(layoutState.selectedLayoutScopeId || null);
    setSelectedDependencyScopeId(layoutState.selectedDependencyScopeId ?? "");
    setDependencyDirection((layoutState.dependencyDirection as DependencyDirection | undefined) ?? "ALL");
    setFocusedDependencyEntityId(layoutState.focusedDependencyEntityId ?? "");
    setSelectedSavedViewId(savedViewId);
  }

  async function handleDuplicateSavedView(savedViewId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Duplicating saved view…");
    try {
      await platformApi.duplicateSavedView<SavedViewRecord>(selectedWorkspaceId, selectedSnapshotId, savedViewId);
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteSavedView(savedViewId: string) {
    if (!selectedWorkspaceId || !selectedSnapshotId) return;
    setBusyMessage("Deleting saved view…");
    try {
      await platformApi.deleteSavedView(selectedWorkspaceId, selectedSnapshotId, savedViewId);
      await loadCustomizationOverview(selectedWorkspaceId, selectedSnapshotId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
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
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Updating workspace…");
    try {
      const updated = await platformApi.updateWorkspace<Workspace>(selectedWorkspaceId, workspaceEditor);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
      await loadWorkspaceDetail(selectedWorkspaceId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveWorkspace() {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Archiving workspace…");
    try {
      const updated = await platformApi.archiveWorkspace<Workspace>(selectedWorkspaceId);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Creating repository registration…");
    try {
      await platformApi.createRepository<Repository>(selectedWorkspaceId, repositoryForm);
      setRepositoryForm(emptyRepositoryForm);
      await loadWorkspaces();
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !repositoryEditor.id) {
      return;
    }
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
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveRepository(repositoryId: string) {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Archiving repository registration…");
    try {
      await platformApi.archiveRepository<Repository>(selectedWorkspaceId, repositoryId);
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleRequestRun(repository: Repository, requestedResult: StubRunResult) {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage(`Requesting ${requestedResult.toLowerCase()} run for ${repository.name}…`);
    try {
      await platformApi.requestRun<RunRecord>(selectedWorkspaceId, repository.id, {
        ...runRequestForm,
        requestedResult,
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
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

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Architecture browser workspace</h1>
        <p className="lead">
          Step 9 extends the snapshot browser with entry-point and data/integration views so architects can inspect endpoints, startup points, data stores, channels,
          and external systems with scope filters, detail panels, and cross-links back to owners and source context.
        </p>
      </section>

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div><dt>Status</dt><dd>{health.status}</dd></div>
            <div><dt>Service</dt><dd>{health.service}</dd></div>
            <div><dt>Version</dt><dd>{health.version}</dd></div>
            <div><dt>Time</dt><dd>{health.time || "—"}</dd></div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <h2>Create workspace</h2>
          <form className="form" onSubmit={handleCreateWorkspace}>
            <label>
              <span>Workspace key</span>
              <input value={workspaceForm.workspaceKey} onChange={(event) => setWorkspaceForm((current) => ({ ...current, workspaceKey: event.target.value }))} placeholder="customs-core" />
            </label>
            <label>
              <span>Name</span>
              <input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Swedish Customs Core" />
            </label>
            <label>
              <span>Description</span>
              <textarea value={workspaceForm.description} onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Architecture review workspace for initial MVP repositories." />
            </label>
            <button type="submit">Create workspace</button>
          </form>
        </article>
      </section>

      <section className="workspace-layout">
        <WorkspaceSidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          setSelectedWorkspaceId={setSelectedWorkspaceId}
        />

        <div className="content-stack">
          <WorkspaceManagementSection
            selectedWorkspace={selectedWorkspace}
            workspaceEditor={workspaceEditor}
            setWorkspaceEditor={setWorkspaceEditor}
            handleUpdateWorkspace={handleUpdateWorkspace}
            handleArchiveWorkspace={handleArchiveWorkspace}
            repositories={repositories}
            repositoryForm={repositoryForm}
            setRepositoryForm={setRepositoryForm}
            handleCreateRepository={handleCreateRepository}
            repositoryEditor={repositoryEditor}
            setRepositoryEditor={setRepositoryEditor}
            handleUpdateRepository={handleUpdateRepository}
            runRequestForm={runRequestForm}
            setRunRequestForm={setRunRequestForm}
            latestRunByRepository={latestRunByRepository}
            selectRepositoryForEdit={selectRepositoryForEdit}
            handleRequestRun={handleRequestRun}
            handleArchiveRepository={handleArchiveRepository}
          />

          <SnapshotCatalogSection
            snapshots={snapshots}
            selectedWorkspace={selectedWorkspace}
            selectedSnapshotId={selectedSnapshotId}
            setSelectedSnapshotId={setSelectedSnapshotId}
            selectedSnapshot={selectedSnapshot}
            snapshotOverview={snapshotOverview}
            flattenedLayoutNodes={flattenedLayoutNodes}
            selectedLayoutScopeId={selectedLayoutScopeId}
            setSelectedLayoutScopeId={setSelectedLayoutScopeId}
            layoutTree={layoutTree}
            layoutScopeDetail={layoutScopeDetail}
            selectedDependencyScopeId={selectedDependencyScopeId}
            setSelectedDependencyScopeId={setSelectedDependencyScopeId}
            dependencyDirection={dependencyDirection}
            setDependencyDirection={setDependencyDirection}
            dependencyView={dependencyView}
            dependencyEntityOptions={dependencyEntityOptions}
            focusedDependencyEntityId={focusedDependencyEntityId}
            setFocusedDependencyEntityId={setFocusedDependencyEntityId}
            selectedEntryPointScopeId={selectedEntryPointScopeId}
            setSelectedEntryPointScopeId={setSelectedEntryPointScopeId}
            entryCategory={entryCategory}
            setEntryCategory={setEntryCategory}
            entryPointView={entryPointView}
            entryPointOptions={entryPointOptions}
            focusedEntryPointId={focusedEntryPointId}
            setFocusedEntryPointId={setFocusedEntryPointId}
            selectedSearchScopeId={selectedSearchScopeId}
            setSelectedSearchScopeId={setSelectedSearchScopeId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchView={searchView}
            searchResultOptions={searchResultOptions}
            selectedSearchEntityId={selectedSearchEntityId}
            setSelectedSearchEntityId={setSelectedSearchEntityId}
            entityDetail={entityDetail}
            customizationOverview={customizationOverview}
            overlayName={overlayName}
            setOverlayName={setOverlayName}
            overlayKind={overlayKind}
            setOverlayKind={setOverlayKind}
            overlayNote={overlayNote}
            setOverlayNote={setOverlayNote}
            handleCreateOverlay={handleCreateOverlay}
            selectedOverlayId={selectedOverlayId}
            setSelectedOverlayId={setSelectedOverlayId}
            handleDeleteOverlay={handleDeleteOverlay}
            savedViewName={savedViewName}
            setSavedViewName={setSavedViewName}
            handleSaveCurrentView={handleSaveCurrentView}
            selectedSavedViewId={selectedSavedViewId}
            setSelectedSavedViewId={setSelectedSavedViewId}
            handleApplySavedView={handleApplySavedView}
            handleDuplicateSavedView={handleDuplicateSavedView}
            handleDeleteSavedView={handleDeleteSavedView}
            comparisonSnapshotId={comparisonSnapshotId}
            setComparisonSnapshotId={setComparisonSnapshotId}
            comparisonOptions={comparisonOptions}
            snapshotComparison={snapshotComparison}
          />

          <OperationsAndAuditSection
            recentRuns={recentRuns}
            selectedWorkspace={selectedWorkspace}
            operationsOverview={operationsOverview}
            retentionForm={retentionForm}
            setRetentionForm={setRetentionForm}
            handlePreviewRetention={handlePreviewRetention}
            handleApplyRetention={handleApplyRetention}
            retentionPreview={retentionPreview}
            auditEvents={auditEvents}
          />
        </div>
      </section>
    </main>
  );
}
