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
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class SnapshotCustomizationResourceTest {
    @Test
    void overlaysAreStoredSeparatelyFromImportedFactsAndProduceAuditEvents() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "customization-repo", "Customization Repo");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        String overlayId = given().contentType(ContentType.JSON).body("""
                {
                  "name": "Review notes",
                  "kind": "ANNOTATION",
                  "targetEntityIds": ["entity:endpoint:orders"],
                  "targetScopeIds": ["scope:package:backend"],
                  "note": "Needs owner confirmation",
                  "attributes": {
                    "owner": "team-orders",
                    "risk": "medium"
                  }
                }
                """).when().post("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/overlays", workspaceId, snapshotId).then().statusCode(201)
            .body("kind", equalTo("ANNOTATION"))
            .body("targetEntityCount", equalTo(1))
            .body("targetScopeCount", equalTo(1))
            .body("note", equalTo("Needs owner confirmation"))
            .extract().path("id");

        given().when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/customizations", workspaceId, snapshotId).then().statusCode(200)
            .body("overlays[0].id", equalTo(overlayId))
            .body("overlays[0].definitionJson", notNullValue())
            .body("savedViews.size()", equalTo(0));

        given().when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/entities/{entityId}", workspaceId, snapshotId, "entity:endpoint:orders").then().statusCode(200)
            .body("entity.displayName", equalTo("GET /orders"))
            .body("metadataJson", equalTo("{\n  \"method\" : \"GET\",\n  \"path\" : \"/orders\"\n}"));

        given().when().get("/api/workspaces/{workspaceId}/audit-events", workspaceId).then().statusCode(200)
            .body("eventType", hasItem("overlay.created"));
    }

    @Test
    void savedViewsCanBeCreatedReopenedDuplicatedAndDeleted() throws Exception {
        String workspaceId = createWorkspace();
        String repositoryId = createRepository(workspaceId, "customization-repo-b", "Customization Repo B");
        String snapshotId = given().contentType(ContentType.JSON).body(read("/contracts/search-rich.json")).when().post("/api/workspaces/{workspaceId}/repositories/{repositoryId}/imports/indexer-ir", workspaceId, repositoryId).then().statusCode(201).extract().path("snapshotId");

        String savedViewId = given().contentType(ContentType.JSON).body("""
                {
                  "name": "Backend orders focus",
                  "viewType": "SNAPSHOT_BROWSER",
                  "queryState": {
                    "selectedSearchScopeId": "scope:package:backend",
                    "searchQuery": "OrderService",
                    "selectedSearchEntityId": "entity:service:orders-backend"
                  },
                  "layoutState": {
                    "selectedLayoutScopeId": "scope:package:backend",
                    "selectedDependencyScopeId": "scope:module:backend",
                    "dependencyDirection": "INBOUND"
                  }
                }
                """).when().post("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-views", workspaceId, snapshotId).then().statusCode(201)
            .body("name", equalTo("Backend orders focus"))
            .body("viewType", equalTo("SNAPSHOT_BROWSER"))
            .extract().path("id");

        given().when().get("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/customizations", workspaceId, snapshotId).then().statusCode(200)
            .body("savedViews[0].id", equalTo(savedViewId))
            .body("savedViews[0].queryJson", notNullValue())
            .body("savedViews[0].layoutJson", notNullValue());

        given().contentType(ContentType.JSON).body("""
                {
                  "name": "Backend orders focus renamed",
                  "viewType": "SNAPSHOT_BROWSER",
                  "queryState": {
                    "selectedSearchScopeId": "scope:package:backend",
                    "searchQuery": "GET /orders"
                  },
                  "layoutState": {
                    "selectedLayoutScopeId": "scope:package:backend",
                    "selectedDependencyScopeId": "scope:module:backend",
                    "dependencyDirection": "ALL"
                  }
                }
                """).when().put("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-views/{savedViewId}", workspaceId, snapshotId, savedViewId).then().statusCode(200)
            .body("name", equalTo("Backend orders focus renamed"));

        given().when().post("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-views/{savedViewId}/duplicate", workspaceId, snapshotId, savedViewId).then().statusCode(201)
            .body("name", equalTo("Backend orders focus renamed copy"));

        given().when().delete("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-views/{savedViewId}", workspaceId, snapshotId, savedViewId).then().statusCode(204);

        given().when().get("/api/workspaces/{workspaceId}/audit-events", workspaceId).then().statusCode(200)
            .body("eventType", hasItem("saved-view.created"))
            .body("eventType", hasItem("saved-view.updated"))
            .body("eventType", hasItem("saved-view.duplicated"))
            .body("eventType", hasItem("saved-view.deleted"));
    }


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

        given().when().get("/api/workspaces/{workspaceId}/audit-events", workspaceId).then().statusCode(200)
            .body("eventType", hasItem("saved-canvas.created"))
            .body("eventType", hasItem("saved-canvas.updated"))
            .body("eventType", hasItem("saved-canvas.duplicated"))
            .body("eventType", hasItem("saved-canvas.deleted"));
    }

    private String createWorkspace() {
        return given().contentType(ContentType.JSON).body("""
                {
                  "workspaceKey": "%s",
                  "name": "Snapshot Customization Space"
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
