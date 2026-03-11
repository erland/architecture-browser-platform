package info.isaksson.erland.architecturebrowser.platform.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;

@QuarkusTest
class WorkspaceManagementResourceTest {
    @Test
    void workspaceCrudAndAuditFlowWorks() {
        String workspaceId = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "customs-core",
                  "name": "Swedish Customs Core",
                  "description": "Initial architecture workspace"
                }
                """)
            .when()
            .post("/api/workspaces")
            .then()
            .statusCode(201)
            .body("workspaceKey", equalTo("customs-core"))
            .body("status", equalTo("ACTIVE"))
            .body("repositoryCount", equalTo(0))
            .extract()
            .path("id");

        given()
            .when()
            .get("/api/workspaces")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1))
            .body("workspaceKey", hasItem("customs-core"));

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "name": "Swedish Customs Core Updated",
                  "description": "Updated workspace description"
                }
                """)
            .when()
            .put("/api/workspaces/{workspaceId}", workspaceId)
            .then()
            .statusCode(200)
            .body("name", equalTo("Swedish Customs Core Updated"))
            .body("description", equalTo("Updated workspace description"));

        given()
            .when()
            .post("/api/workspaces/{workspaceId}/archive", workspaceId)
            .then()
            .statusCode(200)
            .body("status", equalTo("ARCHIVED"));

        given()
            .when()
            .get("/api/workspaces/{workspaceId}/audit-events", workspaceId)
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(3))
            .body("eventType", hasItem("workspace.created"))
            .body("eventType", hasItem("workspace.updated"))
            .body("eventType", hasItem("workspace.archived"));
    }

    @Test
    void workspaceValidationErrorsAreReturned() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                  "workspaceKey": "Invalid Key",
                  "name": ""
                }
                """)
            .when()
            .post("/api/workspaces")
            .then()
            .statusCode(400)
            .body("code", is("validation_error"))
            .body("details", hasSize(2));
    }
}
