package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.runs.IndexRunLifecycleService;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogQueryService;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SourceViewSelectionResolverServiceTest {
    @Test
    void resolvesEntitySourceRefAndSourceHandleFromSnapshotAndRun() throws Exception {
        SourceViewSelectionResolverService service = new SourceViewSelectionResolverService();
        service.snapshotCatalogQueryService = new StubSnapshotCatalogQueryService(snapshotWithPayload("""
            {
              "entities": [
                {
                  "id": "entity-1",
                  "sourceRefs": [
                    { "path": "src/main/java/com/example/OrderService.java", "startLine": 12, "endLine": 34 }
                  ]
                }
              ]
            }
            """));
        service.indexRunLifecycleService = new StubIndexRunLifecycleService(runWithMetadata("""
            {
              "metadata": {
                "sourceAccess": {
                  "sourceHandle": "src_handle_123"
                }
              }
            }
            """));
        service.jsonSupport = jsonSupport();
        service.objectMapper = new ObjectMapper();

        SourceViewReadRequest request = service.resolve("workspace-1", new SourceViewSelectionRequest(
            "snapshot-1", "ENTITY", "entity-1", null, null, null
        ));

        assertEquals("src_handle_123", request.sourceHandle());
        assertEquals("src/main/java/com/example/OrderService.java", request.path());
        assertEquals(12, request.startLine());
        assertEquals(34, request.endLine());
    }

    @Test
    void usesRequestedSourceRefIndexAndExplicitLineOverrides() throws Exception {
        SourceViewSelectionResolverService service = new SourceViewSelectionResolverService();
        service.snapshotCatalogQueryService = new StubSnapshotCatalogQueryService(snapshotWithPayload("""
            {
              "relationships": [
                {
                  "id": "rel-1",
                  "sourceRefs": [
                    { "path": "src/A.java", "startLine": 1, "endLine": 2 },
                    { "path": "src/B.java", "startLine": 20, "endLine": 25 }
                  ]
                }
              ]
            }
            """));
        service.indexRunLifecycleService = new StubIndexRunLifecycleService(runWithMetadata("""
            {
              "metadata": {
                "sourceAccess": {
                  "sourceHandle": "src_handle_456"
                }
              }
            }
            """));
        service.jsonSupport = jsonSupport();
        service.objectMapper = new ObjectMapper();

        SourceViewReadRequest request = service.resolve("workspace-1", new SourceViewSelectionRequest(
            "snapshot-1", "RELATIONSHIP", "rel-1", 1, 22, 23
        ));

        assertEquals("src/B.java", request.path());
        assertEquals(22, request.startLine());
        assertEquals(23, request.endLine());
    }


    @Test
    void resolvesDiagnosticFallbackFilePathWhenExplicitSourceRefsAreMissing() throws Exception {
        SourceViewSelectionResolverService service = new SourceViewSelectionResolverService();
        service.snapshotCatalogQueryService = new StubSnapshotCatalogQueryService(snapshotWithPayload("""
            {
              "diagnostics": [
                {
                  "id": "diag-1",
                  "filePath": "src/main/resources/application.yml"
                }
              ]
            }
            """));
        service.indexRunLifecycleService = new StubIndexRunLifecycleService(runWithMetadata("""
            {
              "metadata": {
                "sourceAccess": {
                  "sourceHandle": "src_handle_diag"
                }
              }
            }
            """));
        service.jsonSupport = jsonSupport();
        service.objectMapper = new ObjectMapper();

        SourceViewReadRequest request = service.resolve("workspace-1", new SourceViewSelectionRequest(
            "snapshot-1", "DIAGNOSTIC", "diag-1", null, null, null
        ));

        assertEquals("src_handle_diag", request.sourceHandle());
        assertEquals("src/main/resources/application.yml", request.path());
        assertEquals(null, request.startLine());
        assertEquals(null, request.endLine());
    }

    @Test
    void rejectsSelectionWhenRunDoesNotContainSourceHandle() throws Exception {
        SourceViewSelectionResolverService service = new SourceViewSelectionResolverService();
        service.snapshotCatalogQueryService = new StubSnapshotCatalogQueryService(snapshotWithPayload("""
            {
              "diagnostics": [
                {
                  "id": "diag-1",
                  "filePath": "src/App.tsx"
                }
              ]
            }
            """));
        service.indexRunLifecycleService = new StubIndexRunLifecycleService(runWithMetadata("{}"));
        service.jsonSupport = jsonSupport();
        service.objectMapper = new ObjectMapper();

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.resolve("workspace-1", new SourceViewSelectionRequest(
            "snapshot-1", "DIAGNOSTIC", "diag-1", null, null, null
        )));

        assertEquals("Run does not contain a sourceHandle for source view.", exception.getMessage());
    }

    private static SnapshotEntity snapshotWithPayload(String payload) {
        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = "snapshot-1";
        snapshot.workspaceId = "workspace-1";
        snapshot.runId = "run-1";
        snapshot.rawPayloadJson = payload;
        snapshot.importedAt = Instant.now();
        snapshot.snapshotKey = "snapshot-key";
        return snapshot;
    }

    private static IndexRunEntity runWithMetadata(String metadataJson) {
        IndexRunEntity run = new IndexRunEntity();
        run.id = "run-1";
        run.workspaceId = "workspace-1";
        run.repositoryRegistrationId = "repo-1";
        run.metadataJson = metadataJson;
        return run;
    }

    private static JsonSupport jsonSupport() throws Exception {
        JsonSupport jsonSupport = new JsonSupport();
        var field = JsonSupport.class.getDeclaredField("objectMapper");
        field.setAccessible(true);
        field.set(jsonSupport, new ObjectMapper());
        return jsonSupport;
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

    private static final class StubIndexRunLifecycleService extends IndexRunLifecycleService {
        private final IndexRunEntity run;

        private StubIndexRunLifecycleService(IndexRunEntity run) {
            this.run = run;
        }

        @Override
        public IndexRunEntity requireRun(String runId) {
            return run;
        }
    }
}
