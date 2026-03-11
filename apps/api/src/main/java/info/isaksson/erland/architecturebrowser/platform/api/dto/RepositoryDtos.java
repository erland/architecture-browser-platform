package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.domain.RepositorySourceType;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryStatus;

import java.time.Instant;

public final class RepositoryDtos {
    private RepositoryDtos() {
    }

    public record CreateRepositoryRequest(
        String repositoryKey,
        String name,
        RepositorySourceType sourceType,
        String localPath,
        String remoteUrl,
        String defaultBranch,
        String metadataJson
    ) {
    }

    public record UpdateRepositoryRequest(
        String name,
        String localPath,
        String remoteUrl,
        String defaultBranch,
        String metadataJson
    ) {
    }

    public record RepositoryResponse(
        String id,
        String workspaceId,
        String repositoryKey,
        String name,
        RepositorySourceType sourceType,
        String localPath,
        String remoteUrl,
        String defaultBranch,
        RepositoryStatus status,
        String metadataJson,
        Instant createdAt,
        Instant updatedAt
    ) {
    }
}
