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
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

@QuarkusTest
class SnapshotCatalogResourceTest {
    @Test
    void catalogListsSnapshotsAndShowsOverview() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "catalog-api", "Catalog API");
        String snapshotId = importSnapshot(workspaceId, repositoryId, "/contracts/minimal-success.json");

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots", workspaceId)
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1))
            .body("id", hasItem(snapshotId))
            .body("find { it.id == '%s' }.repositoryName".formatted(snapshotId), equalTo("Catalog API"))
            .body("find { it.id == '%s' }.entityCount".formatted(snapshotId), equalTo(2));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/repositories/{repositoryId}/snapshots", workspaceId, repositoryId)
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].id", equalTo(snapshotId))
            .body("[0].repositoryKey", equalTo("catalog-api"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("snapshot.id", equalTo(snapshotId))
            .body("source.repositoryId", equalTo("fixture-java-backend"))
            .body("run.detectedTechnologies", hasItem("java"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("snapshot.id", equalTo(snapshotId))
            .body("scopeKinds[0].key", equalTo("PACKAGE"))
            .body("entityKinds.find { it.key == 'CLASS' }.count", equalTo(1))
            .body("relationshipKinds.find { it.key == 'EXPOSES' }.count", equalTo(1))
            .body("topScopes[0].name", notNullValue());


        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/full", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("snapshot.id", equalTo(snapshotId))
            .body("source.repositoryId", equalTo("fixture-java-backend"))
            .body("run.detectedTechnologies", hasItem("java"))
            .body("completeness.status", equalTo("COMPLETE"))
            .body("scopes.size()", equalTo(2))
            .body("scopes[0].externalId", equalTo("scope:repo"))
            .body("entities.size()", equalTo(2))
            .body("entities.find { it.externalId == 'entity:class:demo-controller' }.sourceRefs[0].path", equalTo("src/main/java/com/example/DemoController.java"))
            .body("relationships.size()", equalTo(1))
            .body("relationships[0].fromEntityId", equalTo("entity:class:demo-controller"))
            .body("diagnostics.size()", equalTo(0))
            .body("metadata.metadata.size()", equalTo(0));
    }

    @Test
    void overviewIncludesWarningsForPartialSnapshot() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "catalog-partial", "Catalog Partial");
        String snapshotId = importSnapshot(workspaceId, repositoryId, "/contracts/partial-result.json");

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("snapshot.completenessStatus", equalTo("PARTIAL"))
            .body("warnings.size()", greaterThanOrEqualTo(1))
            .body("recentDiagnostics[0].code", equalTo("typescript.parse-error"));


        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/full", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("snapshot.completenessStatus", equalTo("PARTIAL"))
            .body("completeness.degradedFileCount", greaterThanOrEqualTo(1))
            .body("diagnostics[0].code", equalTo("typescript.parse-error"))
            .body("warnings.size()", greaterThanOrEqualTo(1));
    }


    @Test
    void fullSnapshotToleratesNullDiagnosticMetadataValues() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "catalog-null-metadata", "Catalog Null Metadata");
        String snapshotId = importSnapshot(workspaceId, repositoryId, "/contracts/java-null-diagnostic-metadata.json");

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/full", workspaceId, snapshotId)
            .then()
            .statusCode(200)
            .body("diagnostics.size()", equalTo(1))
            .body("diagnostics[0].code", equalTo("java.parse-warning"))
            .body("diagnostics[0].metadata.path", equalTo("src/main/java/com/example/DemoController.java"))
            .body("diagnostics[0].metadata.symbol", equalTo("DemoController"))
            .body("diagnostics[0].metadata.optionalHint", nullValue());
    }

    private String importSnapshot(String workspaceId, String repositoryId, String resourcePath) throws Exception {
        return given()
            .contentType(ContentType.JSON)
            .body(read(resourcePath))
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId)
            .then()
            .statusCode(201)
            .extract()
            .path("snapshotId");
    }

    private String createWorkspace() {
        return given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Catalog Space"
                }
                """.formatted("snapshot-catalog-space-" + UUID.randomUUID()))
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
