package info.isaksson.erland.architecturebrowser.platform.service.operations;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.*;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.*;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

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

    @Inject
    EntityManager entityManager;

    OperationsOverviewResponse buildOverview(String workspaceId) {
        List<RepositoryRegistrationEntity> repositories = RepositoryRegistrationEntity.list("workspaceId", workspaceId);
        List<RunSummaryProjection> runs = entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewAssembler$RunSummaryProjection(
                r.id, r.repositoryRegistrationId, r.status, r.outcome, r.requestedAt, r.completedAt, r.errorSummary
            )
            from IndexRunEntity r
            where r.workspaceId = :workspaceId
            """, RunSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
        List<SnapshotSummaryProjection> snapshots = entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewAssembler$SnapshotSummaryProjection(
                s.id, s.repositoryRegistrationId, s.runId, s.snapshotKey, s.status, s.completenessStatus,
                s.importedAt, s.diagnosticCount
            )
            from SnapshotEntity s
            where s.workspaceId = :workspaceId
            """, SnapshotSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
        long auditCount = AuditEventEntity.count("workspaceId", workspaceId);

        Map<String, RepositoryRegistrationEntity> repositoryById = repositories.stream()
            .collect(Collectors.toMap(repo -> repo.id, Function.identity()));
        Map<String, Long> snapshotCountsByRepo = snapshots.stream()
            .collect(Collectors.groupingBy(snapshot -> snapshot.repositoryRegistrationId, Collectors.counting()));
        Map<String, Long> runCountsByRepo = runs.stream()
            .collect(Collectors.groupingBy(run -> run.repositoryRegistrationId, Collectors.counting()));
        Map<String, SnapshotSummaryProjection> latestSnapshotByRepo = snapshots.stream()
            .collect(Collectors.toMap(snapshot -> snapshot.repositoryRegistrationId, Function.identity(), this::latestSnapshot));
        Map<String, RunSummaryProjection> latestRunByRepo = runs.stream()
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
            .sorted(Comparator.comparing((RunSummaryProjection run) -> run.requestedAt).reversed())
            .limit(20)
            .map(run -> toRunAdminRow(run, repositoryById.get(run.repositoryRegistrationId), retainedRunIds.contains(run.id)))
            .toList();

        List<FailedRunRow> failedRuns = entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewAssembler$FailedRunProjection(
                r.id, r.repositoryRegistrationId, repo.repositoryKey, repo.name, r.status, r.outcome, r.requestedAt, r.completedAt, r.errorSummary, r.metadataJson
            )
            from IndexRunEntity r
            left join RepositoryRegistrationEntity repo on repo.id = r.repositoryRegistrationId
            where r.workspaceId = :workspaceId and (r.status = :failedStatus or r.outcome = :failedOutcome)
            order by r.requestedAt desc
            """, FailedRunProjection.class)
            .setParameter("workspaceId", workspaceId)
            .setParameter("failedStatus", RunStatus.FAILED)
            .setParameter("failedOutcome", RunOutcome.FAILED)
            .setMaxResults(12)
            .getResultList().stream()
            .map(this::toFailedRunRow)
            .toList();

        List<FailedSnapshotProjection> failedSnapshotProjections = entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewAssembler$FailedSnapshotProjection(
                s.id, s.repositoryRegistrationId, repo.repositoryKey, repo.name, s.snapshotKey, s.status, s.completenessStatus, s.importedAt, s.diagnosticCount, s.rawPayloadJson
            )
            from SnapshotEntity s
            left join RepositoryRegistrationEntity repo on repo.id = s.repositoryRegistrationId
            where s.workspaceId = :workspaceId and (s.status = :failedStatus or s.completenessStatus <> :completeStatus or s.diagnosticCount > 0)
            order by s.importedAt desc
            """, FailedSnapshotProjection.class)
            .setParameter("workspaceId", workspaceId)
            .setParameter("failedStatus", SnapshotStatus.FAILED)
            .setParameter("completeStatus", CompletenessStatus.COMPLETE)
            .setMaxResults(12)
            .getResultList();
        List<FailedSnapshotRow> failedSnapshots = failedSnapshotProjections.stream()
            .map(this::toFailedSnapshot)
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
                auditCount
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
        Map<String, SnapshotSummaryProjection> latestSnapshotByRepo,
        Map<String, RunSummaryProjection> latestRunByRepo,
        Map<String, Long> snapshotCountsByRepo,
        Map<String, Long> runCountsByRepo
    ) {
        SnapshotSummaryProjection latestSnapshot = latestSnapshotByRepo.get(repo.id);
        RunSummaryProjection latestRun = latestRunByRepo.get(repo.id);
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

    private RunAdminRow toRunAdminRow(RunSummaryProjection run, RepositoryRegistrationEntity repository, boolean retainedBySnapshot) {
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

    private FailedRunRow toFailedRunRow(FailedRunProjection run) {
        return new FailedRunRow(
            run.id,
            run.repositoryRegistrationId,
            run.repositoryKey,
            run.repositoryName,
            run.status,
            run.outcome,
            run.requestedAt,
            run.completedAt,
            run.errorSummary,
            run.metadataJson
        );
    }

    private FailedSnapshotRow toFailedSnapshot(FailedSnapshotProjection snapshot) {
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
            snapshot.repositoryKey,
            snapshot.repositoryName,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus.name(),
            snapshot.importedAt,
            snapshot.diagnosticCount,
            diagnostics,
            List.copyOf(warnings)
        );
    }

    static final class RunSummaryProjection {
        final String id;
        final String repositoryRegistrationId;
        final RunStatus status;
        final RunOutcome outcome;
        final Instant requestedAt;
        final Instant completedAt;
        final String errorSummary;

        RunSummaryProjection(String id, String repositoryRegistrationId, RunStatus status, RunOutcome outcome, Instant requestedAt, Instant completedAt, String errorSummary) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.status = status;
            this.outcome = outcome;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
            this.errorSummary = errorSummary;
        }
    }

    static final class SnapshotSummaryProjection {
        final String id;
        final String repositoryRegistrationId;
        final String runId;
        final String snapshotKey;
        final SnapshotStatus status;
        final CompletenessStatus completenessStatus;
        final Instant importedAt;
        final int diagnosticCount;

        SnapshotSummaryProjection(String id, String repositoryRegistrationId, String runId, String snapshotKey, SnapshotStatus status, CompletenessStatus completenessStatus, Instant importedAt, int diagnosticCount) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.runId = runId;
            this.snapshotKey = snapshotKey;
            this.status = status;
            this.completenessStatus = completenessStatus;
            this.importedAt = importedAt;
            this.diagnosticCount = diagnosticCount;
        }
    }

    static final class FailedRunProjection {
        final String id;
        final String repositoryRegistrationId;
        final String repositoryKey;
        final String repositoryName;
        final RunStatus status;
        final RunOutcome outcome;
        final Instant requestedAt;
        final Instant completedAt;
        final String errorSummary;
        final String metadataJson;

        FailedRunProjection(String id, String repositoryRegistrationId, String repositoryKey, String repositoryName, RunStatus status, RunOutcome outcome, Instant requestedAt, Instant completedAt, String errorSummary, String metadataJson) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.repositoryKey = repositoryKey;
            this.repositoryName = repositoryName;
            this.status = status;
            this.outcome = outcome;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
            this.errorSummary = errorSummary;
            this.metadataJson = metadataJson;
        }
    }

    static final class FailedSnapshotProjection {
        final String id;
        final String repositoryRegistrationId;
        final String repositoryKey;
        final String repositoryName;
        final String snapshotKey;
        final SnapshotStatus status;
        final CompletenessStatus completenessStatus;
        final Instant importedAt;
        final int diagnosticCount;
        final String rawPayloadJson;

        FailedSnapshotProjection(String id, String repositoryRegistrationId, String repositoryKey, String repositoryName, String snapshotKey, SnapshotStatus status, CompletenessStatus completenessStatus, Instant importedAt, int diagnosticCount, String rawPayloadJson) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.repositoryKey = repositoryKey;
            this.repositoryName = repositoryName;
            this.snapshotKey = snapshotKey;
            this.status = status;
            this.completenessStatus = completenessStatus;
            this.importedAt = importedAt;
            this.diagnosticCount = diagnosticCount;
            this.rawPayloadJson = rawPayloadJson;
        }
    }

    private ArchitectureIndexDocument parseDocument(String rawPayloadJson) {
        if (rawPayloadJson == null || rawPayloadJson.isBlank()) {
            return new ArchitectureIndexDocument(
                null,
                null,
                null,
                null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                null,
                null
            );
        }
        try {
            return objectMapper.convertValue(jsonSupport.readTree(rawPayloadJson), ArchitectureIndexDocument.class);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Stored snapshot payload could not be parsed.", ex);
        }
    }

    private SnapshotSummaryProjection latestSnapshot(SnapshotSummaryProjection left, SnapshotSummaryProjection right) {
        return left.importedAt.isAfter(right.importedAt) ? left : right;
    }

    private RunSummaryProjection latestRun(RunSummaryProjection left, RunSummaryProjection right) {
        return left.requestedAt.isAfter(right.requestedAt) ? left : right;
    }
}
