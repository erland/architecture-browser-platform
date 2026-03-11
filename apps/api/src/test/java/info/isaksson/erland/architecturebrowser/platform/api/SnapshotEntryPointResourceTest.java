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
class SnapshotEntryPointResourceTest {
    @Test
    void entryPointViewSupportsCategoryFilteringAndFocus() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "entry-repo", "Entry Repo");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/entry-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().queryParam("scopeId", "scope:module:backend").queryParam("category", "ENTRY_POINT").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/entry-points", workspaceId, snapshotId).then().statusCode(200)
            .body("summary.visibleItemCount", equalTo(2))
            .body("summary.entryPointCount", equalTo(2))
            .body("items.kind", hasItem("ENDPOINT"))
            .body("items.kind", hasItem("STARTUP_POINT"));

        given().queryParam("scopeId", "scope:module:backend").queryParam("category", "DATA").queryParam("focusEntityId", "entity:datastore").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/entry-points", workspaceId, snapshotId).then().statusCode(200)
            .body("summary.visibleItemCount", equalTo(2))
            .body("summary.dataCount", equalTo(2))
            .body("focus.item.externalId", equalTo("entity:datastore"))
            .body("focus.item.sourcePath", equalTo("backend/application.yml"))
            .body("focus.inboundRelationships.kind", hasItem("READS"))
            .body("focus.inboundRelationships.kind", hasItem("WRITES"));
    }

    @Test
    void entryPointViewIncludesIntegrationSurfaces() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "entry-repo-b", "Entry Repo B");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/entry-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        given().queryParam("scopeId", "scope:module:backend").queryParam("category", "INTEGRATION").when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/entry-points", workspaceId, snapshotId).then().statusCode(200)
            .body("summary.integrationCount", equalTo(2))
            .body("visibleKinds.key", hasItem("EXTERNAL_SYSTEM"))
            .body("visibleKinds.key", hasItem("SERVICE"))
            .body("items.displayName", hasItem("Payments API"))
            .body("items.displayName", hasItem("order-events-topic"));
    }

    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Entry Space"
                }
                """.formatted("snapshot-entry-space-" + UUID.randomUUID())).when().post("/api/workspaces").then().statusCode(201).extract().path("id");
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
