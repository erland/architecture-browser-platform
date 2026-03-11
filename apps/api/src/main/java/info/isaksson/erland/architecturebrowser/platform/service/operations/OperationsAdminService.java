package info.isaksson.erland.architecturebrowser.platform.service.operations;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.*;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.*;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class OperationsAdminService {
    private static final int DEFAULT_KEEP_SNAPSHOTS = 2;
    private static final int DEFAULT_KEEP_RUNS = 5;

    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    AuditService auditService;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    public OperationsOverviewResponse getOverview(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);

        List<RepositoryRegistrationEntity> repositories = RepositoryRegistrationEntity.list("workspaceId", workspaceId);
        List<IndexRunEntity> runs = IndexRunEntity.list("workspaceId", workspaceId);
        List<SnapshotEntity> snapshots = SnapshotEntity.list("workspaceId", workspaceId);
        List<AuditEventEntity> audits = AuditEventEntity.list("workspaceId", workspaceId);

        Map<String, RepositoryRegistrationEntity> repositoryById = repositories.stream().collect(Collectors.toMap(repo -> repo.id, Function.identity()));
        Map<String, Long> snapshotCountsByRepo = snapshots.stream().collect(Collectors.groupingBy(snapshot -> snapshot.repositoryRegistrationId, Collectors.counting()));
        Map<String, Long> runCountsByRepo = runs.stream().collect(Collectors.groupingBy(run -> run.repositoryRegistrationId, Collectors.counting()));
        Map<String, SnapshotEntity> latestSnapshotByRepo = snapshots.stream().collect(Collectors.toMap(snapshot -> snapshot.repositoryRegistrationId, Function.identity(), this::latestSnapshot));
        Map<String, IndexRunEntity> latestRunByRepo = runs.stream().collect(Collectors.toMap(run -> run.repositoryRegistrationId, Function.identity(), this::latestRun));
        Set<String> retainedRunIds = snapshots.stream().map(snapshot -> snapshot.runId).filter(Objects::nonNull).collect(Collectors.toSet());

        List<RepositoryAdminRow> repositoryRows = repositories.stream()
            .sorted(Comparator.comparing((RepositoryRegistrationEntity repo) -> repo.name, String.CASE_INSENSITIVE_ORDER).thenComparing(repo -> repo.repositoryKey, String.CASE_INSENSITIVE_ORDER))
            .map(repo -> {
                SnapshotEntity latestSnapshot = latestSnapshotByRepo.get(repo.id);
                IndexRunEntity latestRun = latestRunByRepo.get(repo.id);
                return new RepositoryAdminRow(
                    repo.id,
                    repo.repositoryKey,
                    repo.name,
                    repo.status,
                    snapshotCountsByRepo.getOrDefault(repo.id, 0L),
                    runCountsByRepo.getOrDefault(repo.id, 0L),
                    latestSnapshot != null ? latestSnapshot.id : null,
                    latestSnapshot != null ? latestSnapshot.importedAt : null,
                    latestRun != null ? latestRun.id : null,
                    latestRun != null ? latestRun.status : null,
                    latestRun != null ? latestRun.outcome : null,
                    latestRun != null ? latestRun.requestedAt : null
                );
            })
            .toList();

        List<RunAdminRow> recentRuns = runs.stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .limit(20)
            .map(run -> {
                RepositoryRegistrationEntity repo = repositoryById.get(run.repositoryRegistrationId);
                return new RunAdminRow(
                    run.id,
                    run.repositoryRegistrationId,
                    repo != null ? repo.repositoryKey : null,
                    repo != null ? repo.name : null,
                    run.status,
                    run.outcome,
                    run.requestedAt,
                    run.completedAt,
                    run.errorSummary,
                    retainedRunIds.contains(run.id)
                );
            })
            .toList();

        List<FailedRunRow> failedRuns = runs.stream()
            .filter(run -> run.status == RunStatus.FAILED || run.outcome == RunOutcome.FAILED)
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .limit(12)
            .map(run -> {
                RepositoryRegistrationEntity repo = repositoryById.get(run.repositoryRegistrationId);
                return new FailedRunRow(
                    run.id,
                    run.repositoryRegistrationId,
                    repo != null ? repo.repositoryKey : null,
                    repo != null ? repo.name : null,
                    run.status,
                    run.outcome,
                    run.requestedAt,
                    run.completedAt,
                    run.errorSummary,
                    run.metadataJson
                );
            })
            .toList();

        List<FailedSnapshotRow> failedSnapshots = snapshots.stream()
            .filter(snapshot -> snapshot.status == SnapshotStatus.FAILED || snapshot.completenessStatus != CompletenessStatus.COMPLETE || snapshot.diagnosticCount > 0)
            .sorted(Comparator.comparing((SnapshotEntity snapshot) -> snapshot.importedAt).reversed())
            .limit(12)
            .map(snapshot -> toFailedSnapshot(snapshot, repositoryById.get(snapshot.repositoryRegistrationId)))
            .toList();

        return new OperationsOverviewResponse(
            workspaceId,
            new HealthStatus("UP", "architecture-browser-platform-api", "0.1.0", Instant.now()),
            new OperationsSummary(
                repositories.size(),
                repositories.stream().filter(repo -> repo.status == RepositoryStatus.ACTIVE).count(),
                runs.size(),
                runs.stream().filter(run -> run.status == RunStatus.FAILED || run.outcome == RunOutcome.FAILED).count(),
                snapshots.size(),
                snapshots.stream().filter(snapshot -> snapshot.status == SnapshotStatus.FAILED || snapshot.completenessStatus != CompletenessStatus.COMPLETE || snapshot.diagnosticCount > 0).count(),
                audits.size()
            ),
            repositoryRows,
            recentRuns,
            failedRuns,
            failedSnapshots,
            new RetentionPolicyDefaults(DEFAULT_KEEP_SNAPSHOTS, DEFAULT_KEEP_RUNS),
            Instant.now()
        );
    }

    public RetentionPreviewResponse previewRetention(String workspaceId, Integer keepSnapshotsPerRepository, Integer keepRunsPerRepository) {
        workspaceManagementService.requireWorkspace(workspaceId);
        int keepSnapshots = normalizeKeepCount(keepSnapshotsPerRepository, DEFAULT_KEEP_SNAPSHOTS, "keepSnapshotsPerRepository");
        int keepRuns = normalizeKeepCount(keepRunsPerRepository, DEFAULT_KEEP_RUNS, "keepRunsPerRepository");
        return buildRetentionPreview(workspaceId, keepSnapshots, keepRuns, true);
    }

    @Transactional
    public RetentionPreviewResponse applyRetention(String workspaceId, RetentionApplyRequest request) {
        workspaceManagementService.requireWorkspace(workspaceId);
        int keepSnapshots = normalizeKeepCount(request != null ? request.keepSnapshotsPerRepository() : null, DEFAULT_KEEP_SNAPSHOTS, "keepSnapshotsPerRepository");
        int keepRuns = normalizeKeepCount(request != null ? request.keepRunsPerRepository() : null, DEFAULT_KEEP_RUNS, "keepRunsPerRepository");
        boolean dryRun = request != null && request.dryRun();
        RetentionPreview preview = planRetention(workspaceId, keepSnapshots, keepRuns);
        if (!dryRun) {
            applySnapshotDeletes(preview.snapshotEntitiesToDelete());
            applyRunDeletes(preview.runEntitiesToDelete());
            auditService.recordWorkspaceEvent(workspaceId, "retention.applied", jsonSupport.write(Map.of(
                "keepSnapshotsPerRepository", keepSnapshots,
                "keepRunsPerRepository", keepRuns,
                "snapshotDeleteCount", preview.snapshotCandidates().size(),
                "runDeleteCount", preview.runCandidates().size()
            )));
        }
        return preview.toResponse(dryRun);
    }

    private RetentionPreviewResponse buildRetentionPreview(String workspaceId, int keepSnapshots, int keepRuns, boolean dryRun) {
        return planRetention(workspaceId, keepSnapshots, keepRuns).toResponse(dryRun);
    }

    private RetentionPreview planRetention(String workspaceId, int keepSnapshots, int keepRuns) {
        List<RepositoryRegistrationEntity> repositories = RepositoryRegistrationEntity.list("workspaceId", workspaceId);
        Map<String, RepositoryRegistrationEntity> repositoryById = repositories.stream().collect(Collectors.toMap(repo -> repo.id, Function.identity()));
        List<SnapshotEntity> snapshots = SnapshotEntity.list("workspaceId", workspaceId);
        List<IndexRunEntity> runs = IndexRunEntity.list("workspaceId", workspaceId);

        List<SnapshotEntity> snapshotEntitiesToDelete = new ArrayList<>();
        for (RepositoryRegistrationEntity repository : repositories) {
            List<SnapshotEntity> repositorySnapshots = snapshots.stream()
                .filter(snapshot -> repository.id.equals(snapshot.repositoryRegistrationId))
                .sorted(Comparator.comparing((SnapshotEntity snapshot) -> snapshot.importedAt).reversed())
                .toList();
            if (repositorySnapshots.size() > keepSnapshots) {
                snapshotEntitiesToDelete.addAll(repositorySnapshots.subList(keepSnapshots, repositorySnapshots.size()));
            }
        }
        Set<String> retainedSnapshotIds = snapshots.stream().map(snapshot -> snapshot.id).collect(Collectors.toSet());
        snapshotEntitiesToDelete.forEach(snapshot -> retainedSnapshotIds.remove(snapshot.id));

        Set<String> retainedRunIds = snapshots.stream()
            .filter(snapshot -> retainedSnapshotIds.contains(snapshot.id))
            .map(snapshot -> snapshot.runId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        List<IndexRunEntity> runEntitiesToDelete = new ArrayList<>();
        for (RepositoryRegistrationEntity repository : repositories) {
            List<IndexRunEntity> repositoryRuns = runs.stream()
                .filter(run -> repository.id.equals(run.repositoryRegistrationId))
                .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
                .toList();
            int keptTerminalRuns = 0;
            for (IndexRunEntity run : repositoryRuns) {
                if (!isTerminal(run.status)) {
                    continue;
                }
                if (retainedRunIds.contains(run.id)) {
                    continue;
                }
                if (keptTerminalRuns < keepRuns) {
                    keptTerminalRuns++;
                    continue;
                }
                runEntitiesToDelete.add(run);
            }
        }

        List<RetentionSnapshotCandidate> snapshotCandidates = snapshotEntitiesToDelete.stream()
            .sorted(Comparator.comparing((SnapshotEntity snapshot) -> snapshot.importedAt).reversed())
            .map(snapshot -> toSnapshotCandidate(snapshot, repositoryById.get(snapshot.repositoryRegistrationId)))
            .toList();
        List<RetentionRunCandidate> runCandidates = runEntitiesToDelete.stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .map(run -> toRunCandidate(run, repositoryById.get(run.repositoryRegistrationId), retainedRunIds.contains(run.id)))
            .toList();
        return new RetentionPreview(workspaceId, keepSnapshots, keepRuns, snapshotCandidates, runCandidates, snapshotEntitiesToDelete, runEntitiesToDelete);
    }

    private void applySnapshotDeletes(List<SnapshotEntity> snapshotsToDelete) {
        for (SnapshotEntity snapshot : snapshotsToDelete) {
            ImportedFactEntity.delete("snapshotId", snapshot.id);
            OverlayEntity.delete("snapshotId", snapshot.id);
            SavedViewEntity.delete("snapshotId", snapshot.id);
            AuditEventEntity.delete("snapshotId", snapshot.id);
            snapshot.delete();
        }
    }

    private void applyRunDeletes(List<IndexRunEntity> runsToDelete) {
        for (IndexRunEntity run : runsToDelete) {
            AuditEventEntity.delete("runId", run.id);
            run.delete();
        }
    }

    private FailedSnapshotRow toFailedSnapshot(SnapshotEntity snapshot, RepositoryRegistrationEntity repository) {
        ArchitectureIndexDocument document = parseDocument(snapshot.rawPayloadJson);
        List<DiagnosticRow> diagnostics = Optional.ofNullable(document.diagnostics()).orElse(List.of()).stream()
            .map(diagnostic -> new DiagnosticRow(
                diagnostic.id(),
                diagnostic.severity(),
                diagnostic.phase(),
                diagnostic.code(),
                diagnostic.message(),
                diagnostic.fatal(),
                diagnostic.filePath(),
                diagnostic.entityId(),
                diagnostic.scopeId()
            ))
            .limit(8)
            .toList();
        List<String> warnings = new ArrayList<>();
        if (document.completeness() != null && document.completeness().notes() != null) {
            warnings.addAll(document.completeness().notes());
        }
        if (snapshot.status == SnapshotStatus.FAILED) {
            warnings.add(0, "Snapshot import produced a failed completeness state.");
        } else if (snapshot.completenessStatus != CompletenessStatus.COMPLETE) {
            warnings.add(0, "Snapshot import is partial; browse data may omit degraded files or scopes.");
        }
        return new FailedSnapshotRow(
            snapshot.id,
            snapshot.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus.name(),
            snapshot.importedAt,
            snapshot.diagnosticCount,
            diagnostics,
            List.copyOf(warnings)
        );
    }

    private ArchitectureIndexDocument parseDocument(String rawPayloadJson) {
        try {
            return objectMapper.convertValue(jsonSupport.readTree(rawPayloadJson), ArchitectureIndexDocument.class);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Stored snapshot payload could not be parsed.", ex);
        }
    }

    private SnapshotEntity latestSnapshot(SnapshotEntity left, SnapshotEntity right) {
        return left.importedAt.isAfter(right.importedAt) ? left : right;
    }

    private IndexRunEntity latestRun(IndexRunEntity left, IndexRunEntity right) {
        return left.requestedAt.isAfter(right.requestedAt) ? left : right;
    }

    private boolean isTerminal(RunStatus status) {
        return status == RunStatus.COMPLETED || status == RunStatus.FAILED || status == RunStatus.CANCELED;
    }

    private int normalizeKeepCount(Integer requested, int defaultValue, String fieldName) {
        int value = requested == null ? defaultValue : requested;
        if (value < 1) {
            throw new ValidationException(List.of(fieldName + " must be at least 1."));
        }
        return value;
    }

    private RetentionSnapshotCandidate toSnapshotCandidate(SnapshotEntity snapshot, RepositoryRegistrationEntity repository) {
        return new RetentionSnapshotCandidate(
            snapshot.id,
            snapshot.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            snapshot.snapshotKey,
            snapshot.importedAt,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount
        );
    }

    private RetentionRunCandidate toRunCandidate(IndexRunEntity run, RepositoryRegistrationEntity repository, boolean retainedBySnapshot) {
        return new RetentionRunCandidate(
            run.id,
            run.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            run.status,
            run.outcome,
            run.requestedAt,
            retainedBySnapshot,
            run.errorSummary
        );
    }

    private record RetentionPreview(
        String workspaceId,
        int keepSnapshotsPerRepository,
        int keepRunsPerRepository,
        List<RetentionSnapshotCandidate> snapshotCandidates,
        List<RetentionRunCandidate> runCandidates,
        List<SnapshotEntity> snapshotEntitiesToDelete,
        List<IndexRunEntity> runEntitiesToDelete
    ) {
        RetentionPreviewResponse toResponse(boolean dryRun) {
            return new RetentionPreviewResponse(
                workspaceId,
                keepSnapshotsPerRepository,
                keepRunsPerRepository,
                snapshotCandidates.size(),
                runCandidates.size(),
                snapshotCandidates,
                runCandidates,
                Instant.now(),
                dryRun
            );
        }
    }
}
