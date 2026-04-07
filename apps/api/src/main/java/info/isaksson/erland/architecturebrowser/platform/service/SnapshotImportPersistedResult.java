package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileImportArtifact;

import java.util.List;

public record SnapshotImportPersistedResult(
    SnapshotEntity snapshot,
    RunOutcome derivedRunOutcome,
    List<String> warnings,
    SnapshotSourceFileImportArtifact snapshotSourceFiles,
    int persistedSnapshotSourceFileCount
) {
    public SnapshotImportPersistedResult(SnapshotEntity snapshot,
                                         RunOutcome derivedRunOutcome,
                                         List<String> warnings) {
        this(snapshot, derivedRunOutcome, warnings, null, 0);
    }
}
