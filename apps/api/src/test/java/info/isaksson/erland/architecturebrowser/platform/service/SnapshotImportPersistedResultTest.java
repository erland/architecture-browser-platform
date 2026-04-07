package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SnapshotImportPersistedResultTest {
    @Test
    void convenienceConstructorDefaultsSourceFileFields() {
        SnapshotEntity snapshot = new SnapshotEntity();
        SnapshotImportPersistedResult result = new SnapshotImportPersistedResult(snapshot, RunOutcome.SUCCESS, List.of("warn"));

        assertEquals(snapshot, result.snapshot());
        assertEquals(RunOutcome.SUCCESS, result.derivedRunOutcome());
        assertEquals(List.of("warn"), result.warnings());
        assertNull(result.snapshotSourceFiles());
        assertEquals(0, result.persistedSnapshotSourceFileCount());
    }
}
