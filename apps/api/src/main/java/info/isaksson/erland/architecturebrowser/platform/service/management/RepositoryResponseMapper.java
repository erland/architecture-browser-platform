package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.RepositoryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RepositoryResponseMapper {
    public RepositoryResponse toResponse(RepositoryRegistrationEntity entity) {
        return new RepositoryResponse(
            entity.id,
            entity.workspaceId,
            entity.repositoryKey,
            entity.name,
            entity.sourceType,
            entity.localPath,
            entity.remoteUrl,
            entity.defaultBranch,
            entity.status,
            entity.metadataJson,
            entity.createdAt,
            entity.updatedAt
        );
    }
}
