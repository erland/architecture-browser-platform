package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.domain.AuditEventEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
class SnapshotImportResourceTest {
    @Test
    void validPayloadCreatesImmutableSnapshotForRepository() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "platform-api", "Platform API");
        String body = read("/contracts/minimal-success.json");

        String snapshotId = given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then()
            .statusCode(201)
            .body("status", equalTo("READY"))
            .body("completenessStatus", equalTo("COMPLETE"))
            .body("derivedRunOutcome", equalTo("SUCCESS"))
            .body("snapshotId", notNullValue())
            .extract()
            .path("snapshotId");

        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        assertEquals(workspaceId, snapshot.workspaceId);
        assertEquals(repositoryId, snapshot.repositoryRegistrationId);
        assertNull(snapshot.runId);
        assertEquals(2, snapshot.scopeCount);
        assertEquals(5, ImportedFactEntity.count("snapshotId", snapshotId));
    }

    @Test
    void invalidPayloadIsRejectedSafely() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "platform-web", "Platform Web");
        String body = read("/contracts/invalid-missing-source.json");

        long before = SnapshotEntity.count();
        given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then()
            .statusCode(400)
            .body("code", equalTo("validation_error"));
        assertEquals(before, SnapshotEntity.count());
    }

    @Test
    void partialPayloadLinkedToRunProducesPartialOutcomeAndDiagnostics() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "platform-indexer", "Platform Indexer");
        String runId = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "triggerType": "MANUAL",
                  "requestedSchemaVersion": "indexer-ir-v1",
                  "requestedIndexerVersion": "step4-stub",
                  "metadataJson": "{\\"requestedBy\\":\\"test\\"}",
                  "requestedResult": "SUCCESS"
                }
                """)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        String snapshotId = given()
            .contentType(ContentType.JSON)
            .body(read("/contracts/partial-result.json"))
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs/{runId}/imports/indexer-ir", workspaceId, repositoryId, runId)
            .then()
            .statusCode(201)
            .body("runId", equalTo(runId))
            .body("status", equalTo("READY"))
            .body("completenessStatus", equalTo("PARTIAL"))
            .body("derivedRunOutcome", equalTo("PARTIAL"))
            .body("diagnosticCount", equalTo(1))
            .body("warnings", hasItem("Partial import accepted: browse data is available, but omitted/degraded files were reported by the indexer."))
            .extract()
            .path("snapshotId");

        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        assertEquals(runId, snapshot.runId);
        assertEquals(1, snapshot.diagnosticCount);

        IndexRunEntity run = IndexRunEntity.findById(runId);
        assertEquals(RunStatus.COMPLETED, run.status);
        assertEquals(RunOutcome.PARTIAL, run.outcome);
        assertTrue(AuditEventEntity.count("workspaceId", workspaceId) >= 6);
    }

    @Test
    void semanticReferenceErrorsAreRejectedBeforePersistence() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "semantic-check", "Semantic Check Repo");
        long before = SnapshotEntity.count();

        given()
            .contentType(ContentType.JSON)
            .body(read("/contracts/invalid-bad-relationship.json"))
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then()
            .statusCode(400)
            .body("details", hasItem("Relationship rel:bad references missing toEntityId entity:missing"));

        assertEquals(before, SnapshotEntity.count());
    }

    private String createWorkspace() {
        return given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Import Space"
                }
                """.formatted("snapshot-import-space-" + UUID.randomUUID()))
            .when()
            .post("/api/workspaces")
            .then()
            .statusCode(201)
            .extract()
            .path("id");
    }

    private String createRepository(String workspaceId, String repositoryKey, String name) {
        return given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "repositoryKey": "%s",
                  "name": "%s",
                  "sourceType": "GIT",
                  "remoteUrl": "https://github.com/erland/%s",
                  "defaultBranch": "main"
                }
                """.formatted(repositoryKey, name, repositoryKey))
            .when()
            .post("/api/workspaces/{workspaceId}/repositories", workspaceId)
            .then()
            .statusCode(201)
            .extract()
            .path("id");
    }

    private String read(String resourcePath) throws Exception {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IllegalStateException("Missing test resource: " + resourcePath);
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
