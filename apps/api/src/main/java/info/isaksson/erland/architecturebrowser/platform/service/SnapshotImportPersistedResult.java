package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;

import java.util.List;

public record SnapshotImportPersistedResult(
    SnapshotEntity snapshot,
    RunOutcome derivedRunOutcome,
    List<String> warnings
) {
}
