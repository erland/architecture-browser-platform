package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotImportDtos.SnapshotImportResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SnapshotImportWorkflowService {
    @Inject
    SnapshotImportPersistenceService snapshotPersistenceService;

    @Inject
    ImportedFactPersistenceService importedFactPersistenceService;

    @Inject
    SnapshotImportAuditRecorder auditRecorder;

    @Inject
    SnapshotImportResponseFactory responseFactory;

    public SnapshotImportResponse importPreparedDocument(SnapshotImportPathContext context, SnapshotImportPreparedDocument preparedDocument) {
        SnapshotImportPersistedResult result = snapshotPersistenceService.persistSnapshot(
            context.workspace(),
            context.repository(),
            context.run(),
            preparedDocument.document(),
            preparedDocument.payload(),
            preparedDocument.snapshotSourceFiles()
        );
        importedFactPersistenceService.persistFacts(result.snapshot().id, preparedDocument.document());
        auditRecorder.recordImported(
            context.workspace(),
            context.repository(),
            context.run(),
            result.snapshot(),
            preparedDocument.document(),
            result.derivedRunOutcome()
        );
        return responseFactory.create(result);
    }
}
