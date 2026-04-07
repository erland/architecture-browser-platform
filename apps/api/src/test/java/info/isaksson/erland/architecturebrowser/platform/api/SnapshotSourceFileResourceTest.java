package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSnapshotSourceFileRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSourceResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileLookupResult;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileLookupService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SnapshotSourceFileResourceTest {
    @Test
    void servesSnapshotOwnedSourceFileFromLookupService() {
        SnapshotSourceFileResource resource = new SnapshotSourceFileResource();
        resource.snapshotSourceFileLookupService = new RecordingLookupService(
            new SnapshotSourceFileLookupResult(
                "snapshot-1",
                "src/main/java/App.java",
                "java",
                "text/x-java-source",
                128L,
                12,
                "class App {}"
            )
        );

        ReadSourceResponse response = resource.readSnapshotSourceFile(
            "workspace-1",
            new ReadSnapshotSourceFileRequest("snapshot-1", "./src/main/java/App.java", 3, 8)
        );

        assertEquals("src/main/java/App.java", response.path());
        assertEquals("java", response.language());
        assertEquals(12, response.totalLineCount());
        assertEquals(128L, response.fileSizeBytes());
        assertEquals(3, response.requestedStartLine());
        assertEquals(8, response.requestedEndLine());
        assertEquals("class App {}", response.sourceText());
        RecordingLookupService lookup = (RecordingLookupService) resource.snapshotSourceFileLookupService;
        assertEquals("workspace-1", lookup.lastWorkspaceId);
        assertEquals("snapshot-1", lookup.lastSnapshotId);
        assertEquals("./src/main/java/App.java", lookup.lastRelativePath);
    }


    @Test
    void preservesNullRequestedLineRangeWhenServingStoredSnapshotSource() {
        SnapshotSourceFileResource resource = new SnapshotSourceFileResource();
        resource.snapshotSourceFileLookupService = new RecordingLookupService(
            new SnapshotSourceFileLookupResult(
                "snapshot-1",
                "src/main/java/App.java",
                "java",
                "text/x-java-source",
                128L,
                12,
                "class App {}"
            )
        );

        ReadSourceResponse response = resource.readSnapshotSourceFile(
            "workspace-1",
            new ReadSnapshotSourceFileRequest("snapshot-1", "src/main/java/App.java", null, null)
        );

        assertEquals(null, response.requestedStartLine());
        assertEquals(null, response.requestedEndLine());
    }
    @Test
    void rejectsMissingRequestBody() {
        SnapshotSourceFileResource resource = new SnapshotSourceFileResource();
        resource.snapshotSourceFileLookupService = new RecordingLookupService(null);

        ValidationException exception = assertThrows(ValidationException.class,
            () -> resource.readSnapshotSourceFile("workspace-1", null));

        assertEquals("Snapshot source file request body is required.", exception.errors().getFirst());
    }

    @Test
    void mapsBadLookupRequestToValidationError() {
        SnapshotSourceFileResource resource = new SnapshotSourceFileResource();
        resource.snapshotSourceFileLookupService = new ThrowingLookupService(
            new IllegalArgumentException("Snapshot source file lookup requires snapshotId.")
        );

        ValidationException exception = assertThrows(ValidationException.class,
            () -> resource.readSnapshotSourceFile(
                "workspace-1",
                new ReadSnapshotSourceFileRequest(" ", "src/App.java", null, null)
            ));

        assertEquals("Snapshot source file lookup requires snapshotId.", exception.errors().getFirst());
    }

    @Test
    void propagatesNotFoundFromLookupService() {
        SnapshotSourceFileResource resource = new SnapshotSourceFileResource();
        resource.snapshotSourceFileLookupService = new ThrowingLookupService(
            new NotFoundException("Snapshot source file not found for snapshot 'snapshot-1': src/Missing.java")
        );

        NotFoundException exception = assertThrows(NotFoundException.class,
            () -> resource.readSnapshotSourceFile(
                "workspace-1",
                new ReadSnapshotSourceFileRequest("snapshot-1", "src/Missing.java", null, null)
            ));

        assertEquals("Snapshot source file not found for snapshot 'snapshot-1': src/Missing.java", exception.getMessage());
    }

    private static final class RecordingLookupService extends SnapshotSourceFileLookupService {
        private final SnapshotSourceFileLookupResult result;
        private String lastWorkspaceId;
        private String lastSnapshotId;
        private String lastRelativePath;

        private RecordingLookupService(SnapshotSourceFileLookupResult result) {
            this.result = result;
        }

        @Override
        public SnapshotSourceFileLookupResult requireFile(String workspaceId, String snapshotId, String relativePath) {
            this.lastWorkspaceId = workspaceId;
            this.lastSnapshotId = snapshotId;
            this.lastRelativePath = relativePath;
            return result;
        }
    }

    private static final class ThrowingLookupService extends SnapshotSourceFileLookupService {
        private final RuntimeException exception;

        private ThrowingLookupService(RuntimeException exception) {
            this.exception = exception;
        }

        @Override
        public SnapshotSourceFileLookupResult requireFile(String workspaceId, String snapshotId, String relativePath) {
            throw exception;
        }
    }
}
