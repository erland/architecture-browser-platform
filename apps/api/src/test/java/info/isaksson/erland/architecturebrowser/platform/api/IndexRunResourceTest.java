package info.isaksson.erland.architecturebrowser.platform.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class IndexRunResourceTest {
    @Test
    void successAndFailureRunsAreTrackedAndVisible() {
        String workspaceId = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "run-tracking-space",
                  "name": "Run Tracking Space"
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
                  "repositoryKey": "platform-web",
                  "name": "Platform Web",
                  "sourceType": "GIT",
                  "remoteUrl": "https://github.com/erland/architecture-browser-platform",
                  "defaultBranch": "main"
                }
                """)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories", workspaceId)
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "triggerType": "MANUAL",
                  "requestedSchemaVersion": "indexer-ir-v1",
                  "requestedIndexerVersion": "stub-success",
                  "metadataJson": "{\\"requestedBy\\":\\"test\\"}",
                  "requestedResult": "SUCCESS"
                }
                """)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then()
            .statusCode(201)
            .body("status", equalTo("COMPLETED"))
            .body("outcome", equalTo("SUCCESS"))
            .body("startedAt", notNullValue())
            .body("completedAt", notNullValue());

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "triggerType": "MANUAL",
                  "requestedSchemaVersion": "indexer-ir-v1",
                  "requestedIndexerVersion": "stub-failure",
                  "metadataJson": "{\\"requestedBy\\":\\"test\\"}",
                  "requestedResult": "FAILURE"
                }
                """)
            .when()
            .post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then()
            .statusCode(201)
            .body("status", equalTo("FAILED"))
            .body("outcome", equalTo("FAILED"))
            .body("errorSummary", notNullValue());

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs", workspaceId, repositoryId)
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("status", hasItem("COMPLETED"))
            .body("status", hasItem("FAILED"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/runs/recent", workspaceId)
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("repositoryKey", hasItem("platform-web"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/audit-events", workspaceId)
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(8))
            .body("eventType", hasItem("run.requested"))
            .body("eventType", hasItem("run.running"))
            .body("eventType", hasItem("run.completed"))
            .body("eventType", hasItem("run.failed"));
    }
}
