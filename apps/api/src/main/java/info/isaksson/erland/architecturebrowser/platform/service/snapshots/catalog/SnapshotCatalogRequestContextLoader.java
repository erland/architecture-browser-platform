package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SnapshotCatalogRequestContextLoader {
    @Inject
    SnapshotCatalogQueryService queryService;

    public SnapshotCatalogRequestContext load(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = queryService.requireSnapshot(workspaceId, snapshotId);
        SnapshotCatalogSummaryProjection summary = queryService.requireSummary(workspaceId, snapshotId);
        return new SnapshotCatalogRequestContext(snapshot, summary);
    }
}
