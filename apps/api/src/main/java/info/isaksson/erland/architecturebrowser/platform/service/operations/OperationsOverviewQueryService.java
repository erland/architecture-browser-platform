package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.domain.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class OperationsOverviewQueryService {
    @Inject
    EntityManager entityManager;

    List<RepositoryRegistrationEntity> listRepositories(String workspaceId) {
        return RepositoryRegistrationEntity.list("workspaceId", workspaceId);
    }

    List<RunSummaryProjection> listRuns(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewQueryService$RunSummaryProjection(
                r.id, r.repositoryRegistrationId, r.status, r.outcome, r.requestedAt, r.completedAt, r.errorSummary
            )
            from IndexRunEntity r
            where r.workspaceId = :workspaceId
            """, RunSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
    }

    List<SnapshotSummaryProjection> listSnapshots(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewQueryService$SnapshotSummaryProjection(
                s.id, s.repositoryRegistrationId, s.runId, s.snapshotKey, s.status, s.completenessStatus,
                s.importedAt, s.diagnosticCount
            )
            from SnapshotEntity s
            where s.workspaceId = :workspaceId
            """, SnapshotSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
    }

    List<FailedRunProjection> listFailedRuns(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewQueryService$FailedRunProjection(
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
            .getResultList();
    }

    List<FailedSnapshotProjection> listFailedSnapshots(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewQueryService$FailedSnapshotProjection(
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
    }

    long countAuditEvents(String workspaceId) {
        return AuditEventEntity.count("workspaceId", workspaceId);
    }

    public static final class RunSummaryProjection {
        public final String id;
        public final String repositoryRegistrationId;
        public final RunStatus status;
        public final RunOutcome outcome;
        public final Instant requestedAt;
        public final Instant completedAt;
        public final String errorSummary;

        public RunSummaryProjection(String id, String repositoryRegistrationId, RunStatus status, RunOutcome outcome, Instant requestedAt, Instant completedAt, String errorSummary) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.status = status;
            this.outcome = outcome;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
            this.errorSummary = errorSummary;
        }
    }

    public static final class SnapshotSummaryProjection {
        public final String id;
        public final String repositoryRegistrationId;
        public final String runId;
        public final String snapshotKey;
        public final SnapshotStatus status;
        public final CompletenessStatus completenessStatus;
        public final Instant importedAt;
        public final int diagnosticCount;

        public SnapshotSummaryProjection(String id, String repositoryRegistrationId, String runId, String snapshotKey, SnapshotStatus status, CompletenessStatus completenessStatus, Instant importedAt, int diagnosticCount) {
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

    public static final class FailedRunProjection {
        public final String id;
        public final String repositoryRegistrationId;
        public final String repositoryKey;
        public final String repositoryName;
        public final RunStatus status;
        public final RunOutcome outcome;
        public final Instant requestedAt;
        public final Instant completedAt;
        public final String errorSummary;
        public final String metadataJson;

        public FailedRunProjection(String id, String repositoryRegistrationId, String repositoryKey, String repositoryName, RunStatus status, RunOutcome outcome, Instant requestedAt, Instant completedAt, String errorSummary, String metadataJson) {
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

    public static final class FailedSnapshotProjection {
        public final String id;
        public final String repositoryRegistrationId;
        public final String repositoryKey;
        public final String repositoryName;
        public final String snapshotKey;
        public final SnapshotStatus status;
        public final CompletenessStatus completenessStatus;
        public final Instant importedAt;
        public final int diagnosticCount;
        public final String rawPayloadJson;

        public FailedSnapshotProjection(String id, String repositoryRegistrationId, String repositoryKey, String repositoryName, String snapshotKey, SnapshotStatus status, CompletenessStatus completenessStatus, Instant importedAt, int diagnosticCount, String rawPayloadJson) {
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
}
