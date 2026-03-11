package info.isaksson.erland.architecturebrowser.platform.api;

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

@QuarkusTest
class SnapshotLayoutResourceTest {
    @Test
    void layoutTreeAndScopeDrillDownExposeRepositoryModulePackageStructure() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "layout-repo", "Layout Repo");
        String snapshotId = given()
            .contentType(ContentType.JSON)
            .body(read("/contracts/layout-rich.json"))
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then()
            .statusCode(201)
            .extract()
            .path("snapshotId");

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/tree", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("summary.scopeCount", equalTo(4))
            .body("summary.entityCount", equalTo(5))
            .body("summary.maxDepth", equalTo(2))
            .body("roots.size()", equalTo(1))
            .body("roots[0].kind", equalTo("REPOSITORY"))
            .body("roots[0].children.size()", equalTo(2))
            .body("roots[0].descendantEntityCount", equalTo(5))
            .body("roots[0].children[0].kind", equalTo("MODULE"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/scopes/{scopeId}", workspaceId, snapshotId, "scope:module:backend")
            .then()
            .statusCode(200)
            .body("scope.kind", equalTo("MODULE"))
            .body("scope.directChildScopeCount", equalTo(1))
            .body("scope.directEntityCount", equalTo(1))
            .body("scope.descendantEntityCount", equalTo(3))
            .body("breadcrumb.displayName", hasItem("Backend module"))
            .body("childScopes[0].kind", equalTo("PACKAGE"))
            .body("entities.size()", equalTo(1))
            .body("entities[0].kind", equalTo("MODULE"))
            .body("entityKinds[0].key", equalTo("MODULE"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/scopes/{scopeId}", workspaceId, snapshotId, "scope:package:com.example.backend")
            .then()
            .statusCode(200)
            .body("scope.kind", equalTo("PACKAGE"))
            .body("scope.directEntityCount", equalTo(2))
            .body("entities.kind", hasItem("CLASS"))
            .body("entities.kind", hasItem("ENDPOINT"))
            .body("entities.sourceRefCount", hasItem(greaterThanOrEqualTo(1)));
    }

    private String createWorkspace() {
        return given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Layout Space"
                }
                """.formatted("snapshot-layout-space-" + UUID.randomUUID()))
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
