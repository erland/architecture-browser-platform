package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RunLookupService {
    public IndexRunEntity requireRun(String workspaceId, String repositoryId, String runId) {
        IndexRunEntity entity = IndexRunEntity.findById(runId);
        if (entity == null || !workspaceId.equals(entity.workspaceId) || !repositoryId.equals(entity.repositoryRegistrationId)) {
            throw new NotFoundException("Run not found: " + runId);
        }
        return entity;
    }
}
