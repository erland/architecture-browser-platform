package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.WorkspaceResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class WorkspaceResponseMapper {
    @Inject
    WorkspaceRepositoryCountQuery workspaceRepositoryCountQuery;

    public WorkspaceResponse toResponse(WorkspaceEntity entity) {
        long repositoryCount = workspaceRepositoryCountQuery.countRepositories(entity.id);
        return new WorkspaceResponse(
            entity.id,
            entity.workspaceKey,
            entity.name,
            entity.description,
            entity.status,
            entity.createdAt,
            entity.updatedAt,
            repositoryCount
        );
    }
}
