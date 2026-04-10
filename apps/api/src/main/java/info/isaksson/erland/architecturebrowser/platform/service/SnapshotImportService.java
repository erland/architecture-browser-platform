package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotImportDtos.SnapshotImportResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SnapshotImportService {
    @Inject
    SnapshotImportPathResolver pathResolver;

    @Inject
    SnapshotImportDocumentPreparationService documentPreparationService;

    @Inject
    SnapshotImportWorkflowService workflowService;

    @Inject
    SnapshotImportRunLifecycleHandler runLifecycleHandler;

    @Transactional
    public SnapshotImportResponse importForRepository(String workspaceId, String repositoryId, JsonNode payload) {
        SnapshotImportPathContext context = pathResolver.resolveForRepository(workspaceId, repositoryId);
        SnapshotImportPreparedDocument preparedDocument = documentPreparationService.prepare(payload);
        return workflowService.importPreparedDocument(context, preparedDocument);
    }

    @Transactional
    public SnapshotImportResponse importForRun(String workspaceId, String repositoryId, String runId, JsonNode payload) {
        SnapshotImportPathContext context = pathResolver.resolveForRun(workspaceId, repositoryId, runId);
        return runLifecycleHandler.execute(context.run(), payload, () -> {
            SnapshotImportPreparedDocument preparedDocument = documentPreparationService.prepare(payload);
            return workflowService.importPreparedDocument(context, preparedDocument);
        });
    }
}
