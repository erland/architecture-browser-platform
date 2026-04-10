package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RunResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class IndexRunService {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    IndexRunRequestValidator validator;

    @Inject
    IndexRunPersistenceService persistenceService;

    @Inject
    IndexerExecutionGateway indexerExecutionGateway;

    @Inject
    RunQueryService runQueryService;

    @Inject
    RunLookupService runLookupService;

    @Inject
    RunResponseMapper runResponseMapper;

    public RunResponse requestRun(String workspaceId, String repositoryId, RequestRunRequest request) {
        var workspace = workspaceManagementService.requireWorkspace(workspaceId);
        var repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        validator.validate(workspace, repository, request);

        IndexRunEntity entity = persistenceService.createRequestedRun(workspace, repository, request);
        IndexRunEntity finalState = indexerExecutionGateway.execute(workspace, repository, entity, request);
        return runResponseMapper.toResponse(finalState, repository);
    }

    public List<RunResponse> listByRepository(String workspaceId, String repositoryId) {
        var repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        return runQueryService.listByRepository(workspaceId, repositoryId).stream()
            .map(run -> runResponseMapper.toResponse(run, repository))
            .toList();
    }

    public List<RunResponse> listRecentByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return runQueryService.listRecentByWorkspace(workspaceId, 20).stream()
            .map(runResponseMapper::toResponse)
            .toList();
    }

    public RunResponse get(String workspaceId, String repositoryId, String runId) {
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        IndexRunEntity entity = runLookupService.requireRun(workspaceId, repositoryId, runId);
        return runResponseMapper.toResponse(entity, repository);
    }

}
