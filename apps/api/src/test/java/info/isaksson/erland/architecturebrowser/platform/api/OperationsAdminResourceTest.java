package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.domain.AuditEventEntity;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class OperationsAdminResourceTest {
    @Test
    void operationsOverviewShowsFailedRunsAndFailedSnapshots() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "operations-repo", "Operations Repo");

        given().contentType(ContentType.JSON).body(read("/contracts/operations-failed.json"))
            .when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then().statusCode(201);

        given().contentType(ContentType.JSON).body("""
                {
                  "triggerType": "MANUAL",
                  "requestedSchemaVersion": "indexer-ir-v1",
                  "requestedIndexerVersion": "step13-stub",
                  "metadataJson": "{\\"requestedBy\\":\\"test\\"}",
                  "requestedResult": "FAILURE"
                }
                """)
            .when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then().statusCode(201);

        given().when().get("/api/workspaces/{workspaceId}/operations/overview", workspaceId).then().statusCode(200)
            .body("summary.failedRunCount", equalTo(1))
            .body("summary.failedSnapshotCount", equalTo(1))
            .body("failedRuns[0].repositoryKey", equalTo("operations-repo"))
            .body("failedRuns[0].errorSummary", containsString("Stub indexer adapter simulated a failure"))
            .body("failedSnapshots[0].repositoryKey", equalTo("operations-repo"))
            .body("failedSnapshots[0].diagnostics[0].code", equalTo("JAVA_PARSE_FAILURE"))
            .body("failedSnapshots[0].warnings", hasItem(containsString("fatal parser error")));
    }

    @Test
    void retentionPreviewAndApplyDeleteOlderSnapshotsAndRunsSafely() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "retention-repo", "Retention Repo");

        String firstRunId = given().contentType(ContentType.JSON).body(runRequest("SUCCESS")).when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then().statusCode(201).extract().path("id");
        given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs/{runId}/imports/indexer-ir", workspaceId, repositoryId, firstRunId)
            .then().statusCode(201);

        given().contentType(ContentType.JSON).body(read("/contracts/compare-next.json")).when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then().statusCode(201);

        given().contentType(ContentType.JSON).body(runRequest("FAILURE")).when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then().statusCode(201);
        given().contentType(ContentType.JSON).body(runRequest("FAILURE")).when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then().statusCode(201);

        given().queryParam("keepSnapshotsPerRepository", 1).queryParam("keepRunsPerRepository", 1)
            .when().get("/api/workspaces/{workspaceId}/operations/retention/preview", workspaceId)
            .then().statusCode(200)
            .body("snapshotDeleteCount", equalTo(1))
            .body("runDeleteCount", equalTo(2))
            .body("runsToDelete.findAll { !it.retainedBySnapshot }.size()", equalTo(2));

        given().contentType(ContentType.JSON).body("""
                {
                  "keepSnapshotsPerRepository": 1,
                  "keepRunsPerRepository": 1,
                  "dryRun": false
                }
                """).when().post("/api/workspaces/{workspaceId}/operations/retention/apply", workspaceId)
            .then().statusCode(200)
            .body("snapshotDeleteCount", equalTo(1))
            .body("runDeleteCount", equalTo(2))
            .body("dryRun", equalTo(false));

        given().when().get("/api/workspaces/{workspaceId}/snapshots", workspaceId).then().statusCode(200)
            .body("size()", equalTo(1));

        given().when().get("/api/workspaces/{workspaceId}/runs/recent", workspaceId).then().statusCode(200)
            .body("size()", equalTo(1))
            .body("id", not(hasItem(firstRunId)));
        assertTrue(AuditEventEntity.count("workspaceId", workspaceId) >= 1);
    }

    private String runRequest(String result) {
        return """
                {
                  "triggerType": "MANUAL",
                  "requestedSchemaVersion": "indexer-ir-v1",
                  "requestedIndexerVersion": "step13-stub",
                  "metadataJson": "{\\"requestedBy\\":\\"test\\"}",
                  "requestedResult": "%s"
                }
                """.formatted(result);
    }

    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Operations Admin Space"
                }
                """.formatted("operations-admin-space-" + UUID.randomUUID())).when().post("/api/workspaces").then().statusCode(201).extract().path("id");
    }

    private String createRepository(String workspaceId, String repositoryKey, String name) {
        return given().contentType(ContentType.JSON).body("""
                {
                  "repositoryKey": "%s",
                  "name": "%s",
                  "sourceType": "GIT",
                  "remoteUrl": "https://github.com/erland/%s",
                  "defaultBranch": "main"
                }
                """.formatted(repositoryKey, name, repositoryKey)).when().post("/api/workspaces/{workspaceId}/repositories", workspaceId).then().statusCode(201).extract().path("id");
    }

    private String read(String resourcePath) throws Exception {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) throw new IllegalStateException("Missing test resource: " + resourcePath);
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
