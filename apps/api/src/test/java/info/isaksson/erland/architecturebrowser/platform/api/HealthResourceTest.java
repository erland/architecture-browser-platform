package info.isaksson.erland.architecturebrowser.platform.api;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class HealthResourceTest {
    @Test
    void healthEndpointReturnsUp() {
        given()
            .when().get("/api/health")
            .then()
            .statusCode(200)
            .body("status", equalTo("UP"))
            .body("service", equalTo("architecture-browser-platform-api"));
    }
}
