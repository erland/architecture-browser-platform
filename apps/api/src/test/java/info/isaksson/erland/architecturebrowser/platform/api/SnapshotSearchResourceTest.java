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
class SnapshotSearchResourceTest {
    @Test
    void searchDisambiguatesDuplicateNamesAcrossScopes() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "search-repo", "Search Repo");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().queryParam("q", "OrderService").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/search", workspaceId, snapshotId).then().statusCode(200)
            .body("summary.totalMatchCount", equalTo(2))
            .body("results.displayName", hasItem("OrderService"))
            .body("results.scopePath", hasItem("search-repo / backend / backend.api"))
            .body("results.scopePath", hasItem("search-repo / web / web.pages"));

        given().queryParam("q", "OrderService").queryParam("scopeId", "scope:module:web").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/search", workspaceId, snapshotId).then().statusCode(200)
            .body("summary.totalMatchCount", equalTo(1))
            .body("results[0].externalId", equalTo("entity:service:orders-web"));
    }

    @Test
    void entityDetailReturnsSourceContextAndRelationships() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "search-repo-b", "Search Repo B");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/entities/{entityId}", workspaceId, snapshotId, "entity:endpoint:orders").then().statusCode(200)
            .body("entity.displayName", equalTo("GET /orders"))
            .body("entity.inboundRelationshipCount", equalTo(1))
            .body("entity.outboundRelationshipCount", equalTo(1))
            .body("sourceRefs[0].path", equalTo("backend/OrdersController.java"))
            .body("metadataJson", org.hamcrest.Matchers.containsString("\"method\" : \"GET\""))
            .body("inboundRelationships[0].otherDisplayName", equalTo("OrdersPage"))
            .body("outboundRelationships[0].otherDisplayName", equalTo("OrderService"));
    }

    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Search Space"
                }
                """.formatted("snapshot-search-space-" + UUID.randomUUID())).when().post("/api/workspaces").then().statusCode(201).extract().path("id");
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
