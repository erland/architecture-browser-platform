package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;

public record SnapshotCatalogRequestContext(
    SnapshotEntity snapshot,
    SnapshotCatalogSummaryProjection summary
) {
}
