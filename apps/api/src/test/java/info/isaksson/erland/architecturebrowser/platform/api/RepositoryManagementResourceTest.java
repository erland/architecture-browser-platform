package info.isaksson.erland.architecturebrowser.platform.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;

@QuarkusTest
class RepositoryManagementResourceTest {
    @Test
    void repositoryCrudAndAuditFlowWorks() {
        String workspaceId = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "integration-landscape",
                  "name": "Integration Landscape",
                  "description": "Workspace for repository registration tests"
                }
                """)
            .when()
            .post("/api/workspaces")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        String repositoryId = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "repositoryKey": "indexer-service",
                  "name": "Indexer Service",
                  "sourceType": "GIT",
                  "remoteUrl": "https://github.com/erland/indexer-service",
                  "defaultBranch": "main",
                  "metadataJson": "{\\"owner\\":\\"architecture\\"}"
                }
                """)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories", workspaceId)
            .then()
            .statusCode(201)
            .body("repositoryKey", equalTo("indexer-service"))
            .body("sourceType", equalTo("GIT"))
            .body("status", equalTo("ACTIVE"))
            .extract()
            .path("id");

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/repositories", workspaceId)
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("repositoryKey", hasItem("indexer-service"));

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "name": "Indexer Service Updated",
                  "localPath": "",
                  "remoteUrl": "https://github.com/erland/indexer-service",
                  "defaultBranch": "develop",
                  "metadataJson": "{\\"owner\\":\\"ea\\"}"
                }
                """)
            .when()
            .put("/api/workspaces/{workspaceId}/repositories/{repositoryId}", workspaceId, repositoryId)
            .then()
            .statusCode(200)
            .body("name", equalTo("Indexer Service Updated"))
            .body("defaultBranch", equalTo("develop"));

        given()
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/archive", workspaceId, repositoryId)
            .then()
            .statusCode(200)
            .body("status", equalTo("ARCHIVED"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/audit-events", workspaceId)
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(4))
            .body("eventType", hasItem("repository.created"))
            .body("eventType", hasItem("repository.updated"))
            .body("eventType", hasItem("repository.archived"));
    }

    @Test
    void repositoryValidationErrorsAreReturned() {
        String workspaceId = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "validation-space",
                  "name": "Validation Space"
                }
                """)
            .when()
            .post("/api/workspaces")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "repositoryKey": "Repo Key",
                  "name": "",
                  "sourceType": "LOCAL_PATH",
                  "remoteUrl": "https://example.org/repo.git"
                }
                """)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories", workspaceId)
            .then()
            .statusCode(400)
            .body("code", is("validation_error"));
    }
}
