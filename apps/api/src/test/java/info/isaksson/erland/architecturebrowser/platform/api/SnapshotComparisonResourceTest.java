package info.isaksson.erland.architecturebrowser.platform.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;

@QuarkusTest
class SnapshotComparisonResourceTest {
    @Test
    void comparisonHighlightsAddedEntryPointsAndIntegrationChanges() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "comparison-repo", "Comparison Repo");
        String baseSnapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");
        String targetSnapshotId = given().contentType(ContentType.JSON).body(read("/contracts/compare-next.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().queryParam("otherSnapshotId", targetSnapshotId).when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/compare", workspaceId, baseSnapshotId).then().statusCode(200)
            .body("summary.addedEntityCount", equalTo(3))
            .body("summary.removedEntityCount", equalTo(1))
            .body("summary.addedRelationshipCount", equalTo(2))
            .body("summary.removedRelationshipCount", equalTo(1))
            .body("summary.addedEntryPointCount", equalTo(1))
            .body("summary.removedEntryPointCount", equalTo(0))
            .body("summary.changedIntegrationAndPersistenceCount", equalTo(3))
            .body("addedEntryPoints.displayName", hasItem("POST /orders"))
            .body("changedIntegrationAndPersistence.displayName", hasItem("Payments API"))
            .body("changedIntegrationAndPersistence.displayName", hasItem("OrderCommandService"))
            .body("changedIntegrationAndPersistence.displayName", hasItem("orders-db"))
            .body("addedDependencies.label", hasItem("create endpoint calls command service"))
            .body("removedDependencies.label", hasItem("service reads db"));
    }

    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Comparison Space"
                }
                """.formatted("snapshot-comparison-space-" + UUID.randomUUID())).when().post("/api/workspaces").then().statusCode(201).extract().path("id");
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
