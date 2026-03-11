package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RunResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;
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
    StubIndexerAdapter stubIndexerAdapter;

    public RunResponse requestRun(String workspaceId, String repositoryId, RequestRunRequest request) {
        var workspace = workspaceManagementService.requireWorkspace(workspaceId);
        var repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        validator.validate(workspace, repository, request);

        IndexRunEntity entity = persistenceService.createRequestedRun(workspace, repository, request);
        IndexRunEntity finalState = stubIndexerAdapter.execute(entity, request);
        return toResponse(finalState, repository);
    }

    public List<RunResponse> listByRepository(String workspaceId, String repositoryId) {
        var repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        return IndexRunEntity.<IndexRunEntity>list("workspaceId = ?1 and repositoryRegistrationId = ?2", workspaceId, repositoryId).stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .map(run -> toResponse(run, repository))
            .toList();
    }

    public List<RunResponse> listRecentByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return IndexRunEntity.<IndexRunEntity>list("workspaceId", workspaceId).stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .limit(20)
            .map(this::toResponse)
            .toList();
    }

    public RunResponse get(String workspaceId, String repositoryId, String runId) {
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        IndexRunEntity entity = IndexRunEntity.findById(runId);
        if (entity == null || !workspaceId.equals(entity.workspaceId) || !repositoryId.equals(entity.repositoryRegistrationId)) {
            throw new NotFoundException("Run not found: " + runId);
        }
        return toResponse(entity, repository);
    }

    private RunResponse toResponse(IndexRunEntity entity) {
        RepositoryRegistrationEntity repository = RepositoryRegistrationEntity.findById(entity.repositoryRegistrationId);
        return toResponse(entity, repository);
    }

    private RunResponse toResponse(IndexRunEntity entity, RepositoryRegistrationEntity repository) {
        return new RunResponse(
            entity.id,
            entity.workspaceId,
            entity.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            entity.triggerType,
            entity.status,
            entity.outcome,
            entity.requestedAt,
            entity.startedAt,
            entity.completedAt,
            entity.schemaVersion,
            entity.indexerVersion,
            entity.errorSummary,
            entity.metadataJson
        );
    }
}
