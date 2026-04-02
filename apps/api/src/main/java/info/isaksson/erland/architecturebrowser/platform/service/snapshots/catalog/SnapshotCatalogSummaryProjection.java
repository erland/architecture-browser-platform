package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;

import java.time.Instant;

public class SnapshotCatalogSummaryProjection {
    public final String id;
    public final String workspaceId;
    public final String repositoryRegistrationId;
    public final String repositoryKey;
    public final String repositoryName;
    public final String runId;
    public final String snapshotKey;
    public final SnapshotStatus status;
    public final CompletenessStatus completenessStatus;
    public final String schemaVersion;
    public final String indexerVersion;
    public final String sourceRevision;
    public final String sourceBranch;
    public final Instant importedAt;
    public final int scopeCount;
    public final int entityCount;
    public final int relationshipCount;
    public final int diagnosticCount;
    public final int indexedFileCount;
    public final int totalFileCount;
    public final int degradedFileCount;

    public SnapshotCatalogSummaryProjection(
        String id,
        String workspaceId,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        String runId,
        String snapshotKey,
        SnapshotStatus status,
        CompletenessStatus completenessStatus,
        String schemaVersion,
        String indexerVersion,
        String sourceRevision,
        String sourceBranch,
        Instant importedAt,
        int scopeCount,
        int entityCount,
        int relationshipCount,
        int diagnosticCount,
        int indexedFileCount,
        int totalFileCount,
        int degradedFileCount
    ) {
        this.id = id;
        this.workspaceId = workspaceId;
        this.repositoryRegistrationId = repositoryRegistrationId;
        this.repositoryKey = repositoryKey;
        this.repositoryName = repositoryName;
        this.runId = runId;
        this.snapshotKey = snapshotKey;
        this.status = status;
        this.completenessStatus = completenessStatus;
        this.schemaVersion = schemaVersion;
        this.indexerVersion = indexerVersion;
        this.sourceRevision = sourceRevision;
        this.sourceBranch = sourceBranch;
        this.importedAt = importedAt;
        this.scopeCount = scopeCount;
        this.entityCount = entityCount;
        this.relationshipCount = relationshipCount;
        this.diagnosticCount = diagnosticCount;
        this.indexedFileCount = indexedFileCount;
        this.totalFileCount = totalFileCount;
        this.degradedFileCount = degradedFileCount;
    }
}
