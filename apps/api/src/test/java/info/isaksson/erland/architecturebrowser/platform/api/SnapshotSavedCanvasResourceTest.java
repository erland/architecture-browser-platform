package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.domain.AuditEventEntity;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class SnapshotSavedCanvasResourceTest {
    @Test
    void savedCanvasesCanBeCreatedListedFetchedUpdatedDuplicatedAndDeleted() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "customization-repo-c", "Customization Repo C");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        String savedCanvasId = given().contentType(ContentType.JSON).body("""
                {
                  "name": "Orders analysis canvas",
                  "document": {
                    "schemaVersion": "saved-canvas/v1",
                    "canvasId": "canvas-local-1",
                    "name": "Orders analysis canvas",
                    "content": {
                      "nodes": [ ],
                      "edges": [ ],
                      "annotations": [ ]
                    },
                    "bindings": {
                      "originSnapshot": {
                        "snapshotId": "%s",
                        "snapshotKey": "snapshot-key",
                        "workspaceId": "%s",
                        "repositoryRegistrationId": "%s",
                        "repositoryKey": "customization-repo-c",
                        "repositoryName": "Customization Repo C",
                        "sourceBranch": "main",
                        "sourceRevision": "abc123",
                        "importedAt": null
                      },
                      "currentTargetSnapshot": null,
                      "rebinding": null
                    },
                    "presentation": {
                      "viewport": {
                        "x": 10,
                        "y": 20,
                        "zoom": 1.25
                      },
                      "activeViewpointId": null,
                      "layoutMode": "MANUAL",
                      "filters": {
                        "hiddenNodeIds": [ ],
                        "hiddenEdgeIds": [ ]
                      }
                    },
                    "sync": {
                      "state": "LOCAL_ONLY",
                      "localVersion": 1,
                      "backendVersion": null,
                      "lastModifiedAt": "2026-03-24T10:00:00Z",
                      "lastSyncedAt": null,
                      "lastSyncError": null,
                      "conflict": null
                    },
                    "metadata": {
                      "createdAt": "2026-03-24T10:00:00Z",
                      "updatedAt": "2026-03-24T10:00:00Z"
                    }
                  }
                }
                """.formatted(snapshotId, workspaceId, repositoryId)).when().post("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases", workspaceId, snapshotId).then().statusCode(201)
            .body("name", equalTo("Orders analysis canvas"))
            .body("documentVersion", equalTo(1))
            .body("backendVersion", equalTo("1"))
            .extract().path("id");

        given().when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases", workspaceId, snapshotId).then().statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].id", equalTo(savedCanvasId))
            .body("[0].backendVersion", equalTo("1"));

        given().when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases/{savedCanvasId}", workspaceId, snapshotId, savedCanvasId).then().statusCode(200)
            .body("id", equalTo(savedCanvasId))
            .body("documentJson", notNullValue());

        given().contentType(ContentType.JSON).body("""
                {
                  "name": "Orders analysis canvas v2",
                  "expectedBackendVersion": "1",
                  "document": {
                    "schemaVersion": "saved-canvas/v1",
                    "canvasId": "canvas-local-1",
                    "name": "Orders analysis canvas v2",
                    "content": {
                      "nodes": [ ],
                      "edges": [ ],
                      "annotations": [ ]
                    },
                    "bindings": {
                      "originSnapshot": {
                        "snapshotId": "%s",
                        "snapshotKey": "snapshot-key",
                        "workspaceId": "%s",
                        "repositoryRegistrationId": "%s",
                        "repositoryKey": "customization-repo-c",
                        "repositoryName": "Customization Repo C",
                        "sourceBranch": "main",
                        "sourceRevision": "def456",
                        "importedAt": null
                      },
                      "currentTargetSnapshot": null,
                      "rebinding": null
                    },
                    "presentation": {
                      "viewport": {
                        "x": 30,
                        "y": 40,
                        "zoom": 1.5
                      },
                      "activeViewpointId": null,
                      "layoutMode": "MANUAL",
                      "filters": {
                        "hiddenNodeIds": [ ],
                        "hiddenEdgeIds": [ ]
                      }
                    },
                    "sync": {
                      "state": "LOCALLY_MODIFIED",
                      "localVersion": 2,
                      "backendVersion": "1",
                      "lastModifiedAt": "2026-03-24T11:00:00Z",
                      "lastSyncedAt": null,
                      "lastSyncError": null,
                      "conflict": null
                    },
                    "metadata": {
                      "createdAt": "2026-03-24T10:00:00Z",
                      "updatedAt": "2026-03-24T11:00:00Z"
                    }
                  }
                }
                """.formatted(snapshotId, workspaceId, repositoryId)).when().put("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases/{savedCanvasId}", workspaceId, snapshotId, savedCanvasId).then().statusCode(200)
            .body("name", equalTo("Orders analysis canvas v2"))
            .body("documentVersion", equalTo(2))
            .body("backendVersion", equalTo("2"));

        given().when().post("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases/{savedCanvasId}/duplicate", workspaceId, snapshotId, savedCanvasId).then().statusCode(201)
            .body("name", equalTo("Orders analysis canvas v2 copy"))
            .body("documentVersion", equalTo(1));

        given().when().delete("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases/{savedCanvasId}", workspaceId, snapshotId, savedCanvasId).then().statusCode(204);
        assertTrue(AuditEventEntity.count("workspaceId", workspaceId) >= 4);
    }

    @Test
    void savedCanvasUpdateRejectsStaleBackendVersion() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "customization-repo-d", "Customization Repo D");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        String savedCanvasId = given().contentType(ContentType.JSON).body("""
                {
                  "name": "Conflict canvas",
                  "document": {
                    "schemaVersion": "saved-canvas/v1",
                    "canvasId": "canvas-local-conflict",
                    "name": "Conflict canvas",
                    "content": {
                      "nodes": [ ],
                      "edges": [ ],
                      "annotations": [ ]
                    },
                    "bindings": {
                      "originSnapshot": {
                        "snapshotId": "%s",
                        "snapshotKey": "snapshot-key",
                        "workspaceId": "%s",
                        "repositoryRegistrationId": "%s",
                        "repositoryKey": "customization-repo-d",
                        "repositoryName": "Customization Repo D",
                        "sourceBranch": "main",
                        "sourceRevision": "abc123",
                        "importedAt": null
                      },
                      "currentTargetSnapshot": null,
                      "rebinding": null
                    },
                    "presentation": {
                      "viewport": {
                        "x": 0,
                        "y": 0,
                        "zoom": 1.0
                      },
                      "activeViewpointId": null,
                      "layoutMode": "MANUAL",
                      "filters": {
                        "hiddenNodeIds": [ ],
                        "hiddenEdgeIds": [ ]
                      }
                    },
                    "sync": {
                      "state": "LOCAL_ONLY",
                      "localVersion": 1,
                      "backendVersion": null,
                      "lastModifiedAt": "2026-03-24T10:00:00Z",
                      "lastSyncedAt": null,
                      "lastSyncError": null,
                      "conflict": null
                    },
                    "metadata": {
                      "createdAt": "2026-03-24T10:00:00Z",
                      "updatedAt": "2026-03-24T10:00:00Z"
                    }
                  }
                }
                """.formatted(snapshotId, workspaceId, repositoryId)).when().post("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases", workspaceId, snapshotId).then().statusCode(201).extract().path("id");

        given().contentType(ContentType.JSON).body("""
                {
                  "name": "Conflict canvas updated",
                  "expectedBackendVersion": "999",
                  "document": {
                    "schemaVersion": "saved-canvas/v1",
                    "canvasId": "canvas-local-conflict",
                    "name": "Conflict canvas updated",
                    "content": {
                      "nodes": [ ],
                      "edges": [ ],
                      "annotations": [ ]
                    },
                    "bindings": {
                      "originSnapshot": {
                        "snapshotId": "%s",
                        "snapshotKey": "snapshot-key",
                        "workspaceId": "%s",
                        "repositoryRegistrationId": "%s",
                        "repositoryKey": "customization-repo-d",
                        "repositoryName": "Customization Repo D",
                        "sourceBranch": "main",
                        "sourceRevision": "abc123",
                        "importedAt": null
                      },
                      "currentTargetSnapshot": null,
                      "rebinding": null
                    },
                    "presentation": {
                      "viewport": {
                        "x": 0,
                        "y": 0,
                        "zoom": 1.0
                      },
                      "activeViewpointId": null,
                      "layoutMode": "MANUAL",
                      "filters": {
                        "hiddenNodeIds": [ ],
                        "hiddenEdgeIds": [ ]
                      }
                    },
                    "sync": {
                      "state": "LOCALLY_MODIFIED",
                      "localVersion": 2,
                      "backendVersion": "999",
                      "lastModifiedAt": "2026-03-24T11:00:00Z",
                      "lastSyncedAt": null,
                      "lastSyncError": null,
                      "conflict": null
                    },
                    "metadata": {
                      "createdAt": "2026-03-24T10:00:00Z",
                      "updatedAt": "2026-03-24T11:00:00Z"
                    }
                  }
                }
                """.formatted(snapshotId, workspaceId, repositoryId)).when().put("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases/{savedCanvasId}", workspaceId, snapshotId, savedCanvasId).then().statusCode(409);
    }


    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Saved Canvas Space"
                }
                """.formatted("snapshot-customization-space-" + UUID.randomUUID())).when().post("/api/workspaces").then().statusCode(201).extract().path("id");
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
