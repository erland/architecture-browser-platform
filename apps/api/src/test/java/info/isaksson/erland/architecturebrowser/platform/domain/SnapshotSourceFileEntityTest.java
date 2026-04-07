package info.isaksson.erland.architecturebrowser.platform.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SnapshotSourceFileEntityTest {
    @Test
    void exposesExpectedStorageFields() {
        SnapshotSourceFileEntity entity = new SnapshotSourceFileEntity();
        entity.id = "ssf_1";
        entity.snapshotId = "snap_1";
        entity.relativePath = "src/main/java/App.java";
        entity.language = "java";
        entity.contentType = "text/x-java-source";
        entity.sizeBytes = 128L;
        entity.totalLineCount = 12;
        entity.textContent = "class App {}";

        assertEquals("ssf_1", entity.id);
        assertEquals("snap_1", entity.snapshotId);
        assertEquals("src/main/java/App.java", entity.relativePath);
        assertEquals("java", entity.language);
        assertEquals("text/x-java-source", entity.contentType);
        assertEquals(128L, entity.sizeBytes);
        assertEquals(12, entity.totalLineCount);
        assertEquals("class App {}", entity.textContent);
    }
}
