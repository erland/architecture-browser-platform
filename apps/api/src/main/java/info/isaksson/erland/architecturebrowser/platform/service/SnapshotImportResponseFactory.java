package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotImportResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SnapshotImportResponseFactory {
    public SnapshotImportResponse create(SnapshotImportPersistedResult result) {
        SnapshotEntity snapshot = result.snapshot();
        return new SnapshotImportResponse(
            snapshot.id,
            snapshot.workspaceId,
            snapshot.repositoryRegistrationId,
            snapshot.runId,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus,
            result.derivedRunOutcome(),
            snapshot.schemaVersion,
            snapshot.indexerVersion,
            snapshot.importedAt,
            snapshot.scopeCount,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount,
            snapshot.indexedFileCount,
            snapshot.totalFileCount,
            snapshot.degradedFileCount,
            result.warnings()
        );
    }
}
