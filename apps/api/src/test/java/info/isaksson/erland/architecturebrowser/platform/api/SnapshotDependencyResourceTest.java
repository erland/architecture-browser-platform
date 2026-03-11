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
class SnapshotDependencyResourceTest {
    @Test
    void dependencyViewSupportsScopeFilteringAndEntityFocus() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "dependency-repo", "Dependency Repo");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/layout-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().queryParam("scopeId", "scope:module:backend").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/dependencies", workspaceId, snapshotId).then().statusCode(200)
            .body("scope.externalId", equalTo("scope:module:backend"))
            .body("summary.scopeEntityCount", equalTo(3))
            .body("summary.visibleEntityCount", equalTo(4))
            .body("summary.visibleRelationshipCount", equalTo(2))
            .body("summary.internalRelationshipCount", equalTo(1))
            .body("summary.inboundRelationshipCount", equalTo(1))
            .body("summary.outboundRelationshipCount", equalTo(0))
            .body("relationshipKinds.key", hasItem("CALLS"))
            .body("relationshipKinds.key", hasItem("EXPOSES"))
            .body("entities.externalId", hasItem("entity:component:dashboard"))
            .body("relationships.directionCategory", hasItem("INBOUND"))
            .body("relationships.directionCategory", hasItem("INTERNAL"));

        given().queryParam("scopeId", "scope:module:backend").queryParam("focusEntityId", "entity:endpoint:demo").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/dependencies", workspaceId, snapshotId).then().statusCode(200)
            .body("focus.entity.externalId", equalTo("entity:endpoint:demo"))
            .body("focus.inboundRelationshipCount", equalTo(2))
            .body("focus.outboundRelationshipCount", equalTo(0))
            .body("focus.inboundRelationships.kind", hasItem("CALLS"))
            .body("focus.inboundRelationships.kind", hasItem("EXPOSES"));
    }

    @Test
    void dependencyViewSupportsDirectionalFiltering() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "dependency-repo-b", "Dependency Repo B");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/layout-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().queryParam("scopeId", "scope:module:backend").queryParam("direction", "INBOUND").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/dependencies", workspaceId, snapshotId).then().statusCode(200)
            .body("summary.visibleRelationshipCount", equalTo(1))
            .body("summary.inboundRelationshipCount", equalTo(1))
            .body("summary.internalRelationshipCount", equalTo(0))
            .body("relationships[0].kind", equalTo("CALLS"))
            .body("relationships[0].directionCategory", equalTo("INBOUND"));
    }

    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Dependency Space"
                }
                """.formatted("snapshot-dependency-space-" + UUID.randomUUID())).when().post("/api/workspaces").then().statusCode(201).extract().path("id");
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
