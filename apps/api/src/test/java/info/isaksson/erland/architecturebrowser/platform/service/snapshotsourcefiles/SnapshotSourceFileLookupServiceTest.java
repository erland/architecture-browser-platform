package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotSourceFileEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogQueryService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SnapshotSourceFileLookupServiceTest {
    @Test
    void resolvesStoredSourceFileBySnapshotAndNormalizedRelativePath() {
        RecordingLookupService service = new RecordingLookupService(entity("snapshot-1", "src/main/java/App.java"));
        service.snapshotCatalogQueryService = new StubSnapshotCatalogQueryService(snapshot("workspace-1", "snapshot-1"));

        SnapshotSourceFileLookupResult result = service.requireFile("workspace-1", "snapshot-1", "./src/main/java/App.java");

        assertEquals("snapshot-1", result.snapshotId());
        assertEquals("src/main/java/App.java", result.relativePath());
        assertEquals("java", result.language());
        assertEquals("text/x-java-source", result.contentType());
        assertEquals(120L, result.sizeBytes());
        assertEquals(8, result.totalLineCount());
        assertEquals("class App {}", result.textContent());
        assertEquals("snapshot-1", service.lastSnapshotId);
        assertEquals("src/main/java/App.java", service.lastRelativePath);
    }

    @Test
    void rejectsEscapingRelativePath() {
        SnapshotSourceFileLookupService service = new SnapshotSourceFileLookupService();
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> service.normalizeRelativePath("../etc/passwd"));
        assertEquals("Snapshot source file lookup path must not escape the snapshot source root.", exception.getMessage());
    }

    @Test
    void throwsNotFoundWhenSnapshotFileIsMissing() {
        RecordingLookupService service = new RecordingLookupService(null);
        service.snapshotCatalogQueryService = new StubSnapshotCatalogQueryService(snapshot("workspace-1", "snapshot-1"));

        NotFoundException exception = assertThrows(NotFoundException.class,
            () -> service.requireFile("workspace-1", "snapshot-1", "src/missing.txt"));

        assertEquals("Snapshot source file not found for snapshot 'snapshot-1': src/missing.txt", exception.getMessage());
    }


    @Test
    void mapsNullTextContentToEmptyString() {
        SnapshotSourceFileLookupService service = new SnapshotSourceFileLookupService();
        SnapshotSourceFileEntity entity = entity("snapshot-1", "src/main/java/App.java");
        entity.textContent = null;

        SnapshotSourceFileLookupResult result = service.map(entity);

        assertEquals("", result.textContent());
    }
    private static SnapshotEntity snapshot(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = snapshotId;
        snapshot.workspaceId = workspaceId;
        return snapshot;
    }

    private static SnapshotSourceFileEntity entity(String snapshotId, String relativePath) {
        SnapshotSourceFileEntity entity = new SnapshotSourceFileEntity();
        entity.snapshotId = snapshotId;
        entity.relativePath = relativePath;
        entity.language = "java";
        entity.contentType = "text/x-java-source";
        entity.sizeBytes = 120L;
        entity.totalLineCount = 8;
        entity.textContent = "class App {}";
        return entity;
    }

    private static final class RecordingLookupService extends SnapshotSourceFileLookupService {
        private final SnapshotSourceFileEntity entity;
        private String lastSnapshotId;
        private String lastRelativePath;

        private RecordingLookupService(SnapshotSourceFileEntity entity) {
            this.entity = entity;
        }

        @Override
        protected SnapshotSourceFileEntity findBySnapshotAndRelativePath(String snapshotId, String relativePath) {
            this.lastSnapshotId = snapshotId;
            this.lastRelativePath = relativePath;
            return entity;
        }
    }

    private static final class StubSnapshotCatalogQueryService extends SnapshotCatalogQueryService {
        private final SnapshotEntity snapshot;

        private StubSnapshotCatalogQueryService(SnapshotEntity snapshot) {
            this.snapshot = snapshot;
        }

        @Override
        public SnapshotEntity requireSnapshot(String workspaceId, String snapshotId) {
            return snapshot;
        }
    }
}
