package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Comparator;
import java.util.List;

@ApplicationScoped
public class RunQueryService {
    public List<IndexRunEntity> listByRepository(String workspaceId, String repositoryId) {
        return IndexRunEntity.<IndexRunEntity>list("workspaceId = ?1 and repositoryRegistrationId = ?2", workspaceId, repositoryId).stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .toList();
    }

    public List<IndexRunEntity> listRecentByWorkspace(String workspaceId, int limit) {
        return IndexRunEntity.<IndexRunEntity>list("workspaceId", workspaceId).stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .limit(limit)
            .toList();
    }
}
