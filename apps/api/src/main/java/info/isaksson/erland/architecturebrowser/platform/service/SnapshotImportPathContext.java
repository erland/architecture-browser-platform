package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;

public record SnapshotImportPathContext(
    WorkspaceEntity workspace,
    RepositoryRegistrationEntity repository,
    IndexRunEntity run
) {
}
