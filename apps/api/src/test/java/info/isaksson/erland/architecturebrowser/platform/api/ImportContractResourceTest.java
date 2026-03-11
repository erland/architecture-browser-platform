package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
class ImportContractResourceTest {
    @Test
    void storesMinimalPayloadInStubPath() throws Exception {
        String body = read("/contracts/minimal-success.json");

        String snapshotId =
            given()
                .contentType("application/json")
                .body(body)
            .when()
                .post("/api/imports/indexer-ir/stub-store")
            .then()
                .statusCode(201)
                .body("stored", equalTo(true))
                .body("snapshotId", notNullValue())
                .body("counts.scopes", equalTo(2))
                .body("counts.entities", equalTo(2))
                .body("counts.relationships", equalTo(1))
            .extract()
                .path("snapshotId");

        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        assertEquals(2, snapshot.scopeCount);
        assertEquals(5, ImportedFactEntity.count("snapshotId", snapshotId));
    }

    private String read(String resourcePath) throws Exception {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
