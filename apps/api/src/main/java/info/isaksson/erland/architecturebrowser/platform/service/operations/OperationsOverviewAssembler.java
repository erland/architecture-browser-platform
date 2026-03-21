package info.isaksson.erland.architecturebrowser.platform.service.operations;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.*;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.*;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class OperationsOverviewAssembler {
    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    OperationsOverviewResponse buildOverview(String workspaceId) {
        List<RepositoryRegistrationEntity> repositories = RepositoryRegistrationEntity.list("workspaceId", workspaceId);
        List<IndexRunEntity> runs = IndexRunEntity.list("workspaceId", workspaceId);
        List<SnapshotEntity> snapshots = SnapshotEntity.list("workspaceId", workspaceId);
        List<AuditEventEntity> audits = AuditEventEntity.list("workspaceId", workspaceId);

        Map<String, RepositoryRegistrationEntity> repositoryById = repositories.stream()
            .collect(Collectors.toMap(repo -> repo.id, Function.identity()));
        Map<String, Long> snapshotCountsByRepo = snapshots.stream()
            .collect(Collectors.groupingBy(snapshot -> snapshot.repositoryRegistrationId, Collectors.counting()));
        Map<String, Long> runCountsByRepo = runs.stream()
            .collect(Collectors.groupingBy(run -> run.repositoryRegistrationId, Collectors.counting()));
        Map<String, SnapshotEntity> latestSnapshotByRepo = snapshots.stream()
            .collect(Collectors.toMap(snapshot -> snapshot.repositoryRegistrationId, Function.identity(), this::latestSnapshot));
        Map<String, IndexRunEntity> latestRunByRepo = runs.stream()
            .collect(Collectors.toMap(run -> run.repositoryRegistrationId, Function.identity(), this::latestRun));
        Set<String> retainedRunIds = snapshots.stream()
            .map(snapshot -> snapshot.runId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        List<RepositoryAdminRow> repositoryRows = repositories.stream()
            .sorted(Comparator.comparing((RepositoryRegistrationEntity repo) -> repo.name, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(repo -> repo.repositoryKey, String.CASE_INSENSITIVE_ORDER))
            .map(repo -> toRepositoryRow(repo, latestSnapshotByRepo, latestRunByRepo, snapshotCountsByRepo, runCountsByRepo))
            .toList();

        List<RunAdminRow> recentRuns = runs.stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .limit(20)
            .map(run -> toRunAdminRow(run, repositoryById.get(run.repositoryRegistrationId), retainedRunIds.contains(run.id)))
            .toList();

        List<FailedRunRow> failedRuns = runs.stream()
            .filter(run -> run.status == RunStatus.FAILED || run.outcome == RunOutcome.FAILED)
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .limit(12)
            .map(run -> toFailedRunRow(run, repositoryById.get(run.repositoryRegistrationId)))
            .toList();

        List<FailedSnapshotRow> failedSnapshots = snapshots.stream()
            .filter(snapshot -> snapshot.status == SnapshotStatus.FAILED
                || snapshot.completenessStatus != CompletenessStatus.COMPLETE
                || snapshot.diagnosticCount > 0)
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
                snapshots.stream().filter(snapshot -> snapshot.status == SnapshotStatus.FAILED
                    || snapshot.completenessStatus != CompletenessStatus.COMPLETE
                    || snapshot.diagnosticCount > 0).count(),
                audits.size()
            ),
            repositoryRows,
            recentRuns,
            failedRuns,
            failedSnapshots,
            new RetentionPolicyDefaults(OperationsAdminService.DEFAULT_KEEP_SNAPSHOTS, OperationsAdminService.DEFAULT_KEEP_RUNS),
            Instant.now()
        );
    }

    private RepositoryAdminRow toRepositoryRow(
        RepositoryRegistrationEntity repo,
        Map<String, SnapshotEntity> latestSnapshotByRepo,
        Map<String, IndexRunEntity> latestRunByRepo,
        Map<String, Long> snapshotCountsByRepo,
        Map<String, Long> runCountsByRepo
    ) {
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
    }

    private RunAdminRow toRunAdminRow(IndexRunEntity run, RepositoryRegistrationEntity repository, boolean retainedBySnapshot) {
        return new RunAdminRow(
            run.id,
            run.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            run.status,
            run.outcome,
            run.requestedAt,
            run.completedAt,
            run.errorSummary,
            retainedBySnapshot
        );
    }

    private FailedRunRow toFailedRunRow(IndexRunEntity run, RepositoryRegistrationEntity repository) {
        return new FailedRunRow(
            run.id,
            run.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            run.status,
            run.outcome,
            run.requestedAt,
            run.completedAt,
            run.errorSummary,
            run.metadataJson
        );
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
}
