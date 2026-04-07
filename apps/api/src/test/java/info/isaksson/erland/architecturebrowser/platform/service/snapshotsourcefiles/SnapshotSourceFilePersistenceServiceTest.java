package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SnapshotSourceFilePersistenceServiceTest {
    @Test
    void buildsDistinctEntitiesOncePerRelativePathForSnapshot() {
        SnapshotSourceFilePersistenceService service = new SnapshotSourceFilePersistenceService();
        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = "snap_1";

        SnapshotSourceFileImportArtifact artifact = new SnapshotSourceFileImportArtifact(
            SnapshotSourceFileSidecarReader.CONTRACT_TYPE,
            List.of(
                new SnapshotSourceFileImportEntry("src/main/java/App.java", "java", "text/x-java-source", 12L, 2, "class App {}"),
                new SnapshotSourceFileImportEntry("./src/main/java/App.java", "java", "text/x-java-source", 99L, 9, "ignored duplicate"),
                new SnapshotSourceFileImportEntry("src/main/resources/app.yml", " yaml ", " text/yaml ", 8L, 1, "a: b")
            ),
            Map.of()
        );

        List<?> entities = service.buildEntities(snapshot, artifact);
        assertEquals(2, entities.size());

        var first = (info.isaksson.erland.architecturebrowser.platform.domain.SnapshotSourceFileEntity) entities.get(0);
        assertEquals("snap_1", first.snapshotId);
        assertEquals("src/main/java/App.java", first.relativePath);
        assertEquals("java", first.language);
        assertEquals("text/x-java-source", first.contentType);
        assertEquals(12L, first.sizeBytes);
        assertEquals(2, first.totalLineCount);
        assertEquals("class App {}", first.textContent);

        var second = (info.isaksson.erland.architecturebrowser.platform.domain.SnapshotSourceFileEntity) entities.get(1);
        assertEquals("src/main/resources/app.yml", second.relativePath);
        assertEquals("yaml", second.language);
        assertEquals("text/yaml", second.contentType);
    }

    @Test
    void normalizesNullAndNegativeMetadata() {
        SnapshotSourceFilePersistenceService service = new SnapshotSourceFilePersistenceService();
        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = "snap_2";

        SnapshotSourceFileImportArtifact artifact = new SnapshotSourceFileImportArtifact(
            SnapshotSourceFileSidecarReader.CONTRACT_TYPE,
            List.of(
                new SnapshotSourceFileImportEntry("src/test.txt", "   ", " ", -4L, -2, null)
            ),
            Map.of()
        );

        var entity = service.buildEntities(snapshot, artifact).get(0);
        assertEquals("src/test.txt", entity.relativePath);
        assertNull(entity.language);
        assertNull(entity.contentType);
        assertEquals(0L, entity.sizeBytes);
        assertEquals(0, entity.totalLineCount);
        assertEquals("", entity.textContent);
    }
}
