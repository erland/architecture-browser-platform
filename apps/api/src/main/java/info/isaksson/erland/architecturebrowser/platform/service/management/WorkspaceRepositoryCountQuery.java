package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class WorkspaceRepositoryCountQuery {
    public long countRepositories(String workspaceId) {
        return RepositoryRegistrationEntity.count("workspaceId", workspaceId);
    }
}
