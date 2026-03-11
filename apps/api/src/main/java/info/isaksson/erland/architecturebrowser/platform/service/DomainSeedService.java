package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.domain.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;

@ApplicationScoped
public class DomainSeedService {
    @Transactional
    public void ensureWorkspaceAndRepository(String workspaceId, String workspaceKey, String repositoryRegistrationId, String repositoryKey, String repositoryName, String repositoryPath, String repositoryRemoteUrl, String branch) {
        WorkspaceEntity workspace = WorkspaceEntity.findById(workspaceId);
        Instant now = Instant.now();
        if (workspace == null) {
            workspace = new WorkspaceEntity();
            workspace.id = workspaceId;
            workspace.workspaceKey = workspaceKey;
            workspace.name = workspaceKey;
            workspace.description = "Seeded automatically by stub import";
            workspace.status = WorkspaceStatus.ACTIVE;
            workspace.createdAt = now;
            workspace.updatedAt = now;
            workspace.persist();
        }

        RepositoryRegistrationEntity repository = RepositoryRegistrationEntity.findById(repositoryRegistrationId);
        if (repository == null) {
            repository = new RepositoryRegistrationEntity();
            repository.id = repositoryRegistrationId;
            repository.workspaceId = workspaceId;
            repository.repositoryKey = repositoryKey;
            repository.name = repositoryName;
            repository.sourceType = repositoryRemoteUrl != null && !repositoryRemoteUrl.isBlank() ? RepositorySourceType.GIT : RepositorySourceType.LOCAL_PATH;
            repository.localPath = repositoryPath;
            repository.remoteUrl = repositoryRemoteUrl;
            repository.defaultBranch = branch;
            repository.status = RepositoryStatus.ACTIVE;
            repository.metadataJson = "{}";
            repository.createdAt = now;
            repository.updatedAt = now;
            repository.persist();
        }
    }
}
