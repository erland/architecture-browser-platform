package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class OperationsOverviewAttentionQueryService {
    @Inject
    EntityManager entityManager;

    List<FailedRunProjection> listFailedRuns(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewAttentionQueryService$FailedRunProjection(
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
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewAttentionQueryService$FailedSnapshotProjection(
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
