package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RunResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RunResponseMapper {
    public RunResponse toResponse(IndexRunEntity entity, RepositoryRegistrationEntity repository) {
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

    public RunResponse toResponse(IndexRunEntity entity) {
        RepositoryRegistrationEntity repository = RepositoryRegistrationEntity.findById(entity.repositoryRegistrationId);
        return toResponse(entity, repository);
    }
}
