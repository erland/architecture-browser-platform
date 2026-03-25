package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotImportResponse;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.runs.IndexRunLifecycleService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class SnapshotImportService {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    IndexRunLifecycleService runLifecycleService;

    @Inject
    SnapshotImportDocumentParser documentParser;

    @Inject
    SnapshotImportPersistenceService snapshotPersistenceService;

    @Inject
    ImportedFactPersistenceService importedFactPersistenceService;

    @Inject
    SnapshotImportAuditRecorder auditRecorder;

    @Inject
    SnapshotImportResponseFactory responseFactory;

    @Inject
    SnapshotImportRunLifecycleHandler runLifecycleHandler;

    @Transactional
    public SnapshotImportResponse importForRepository(String workspaceId, String repositoryId, JsonNode payload) {
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        return importDocument(workspace, repository, null, payload);
    }

    @Transactional
    public SnapshotImportResponse importForRun(String workspaceId, String repositoryId, String runId, JsonNode payload) {
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        IndexRunEntity run = requireRunForPath(workspaceId, repositoryId, runId);
        return runLifecycleHandler.execute(run, payload, () -> importDocument(workspace, repository, run, payload));
    }

    private IndexRunEntity requireRunForPath(String workspaceId, String repositoryId, String runId) {
        IndexRunEntity run = runLifecycleService.requireRun(runId);
        if (!workspaceId.equals(run.workspaceId) || !repositoryId.equals(run.repositoryRegistrationId)) {
            throw new ValidationException(List.of("Run does not belong to the supplied workspace/repository path."));
        }
        return run;
    }

    private SnapshotImportResponse importDocument(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, IndexRunEntity run, JsonNode payload) {
        ArchitectureIndexDocument document = documentParser.validateAndParse(payload);
        SnapshotImportPersistedResult result = snapshotPersistenceService.persistSnapshot(workspace, repository, run, document, payload);
        importedFactPersistenceService.persistFacts(result.snapshot().id, document);
        auditRecorder.recordImported(workspace, repository, run, result.snapshot(), document, result.derivedRunOutcome());
        return responseFactory.create(result);
    }
}
