package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.runs.IndexRunLifecycleService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class SnapshotImportPathResolver {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    IndexRunLifecycleService runLifecycleService;

    public SnapshotImportPathContext resolveForRepository(String workspaceId, String repositoryId) {
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        return new SnapshotImportPathContext(workspace, repository, null);
    }

    public SnapshotImportPathContext resolveForRun(String workspaceId, String repositoryId, String runId) {
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        IndexRunEntity run = requireRunForPath(workspaceId, repositoryId, runId);
        return new SnapshotImportPathContext(workspace, repository, run);
    }

    private IndexRunEntity requireRunForPath(String workspaceId, String repositoryId, String runId) {
        IndexRunEntity run = runLifecycleService.requireRun(runId);
        if (!workspaceId.equals(run.workspaceId) || !repositoryId.equals(run.repositoryRegistrationId)) {
            throw new ValidationException(List.of("Run does not belong to the supplied workspace/repository path."));
        }
        return run;
    }
}
