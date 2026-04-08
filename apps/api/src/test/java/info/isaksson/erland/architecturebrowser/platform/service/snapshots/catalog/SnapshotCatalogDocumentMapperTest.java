package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SnapshotCatalogDocumentMapperTest {
    private final SnapshotCatalogDocumentMapper mapper = new SnapshotCatalogDocumentMapper();

    @Test
    void mapsCanonicalDocumentToBrowserDtos() {
        SnapshotCatalogCanonicalDocument canonical = new SnapshotCatalogCanonicalDocument(
            new SnapshotCatalogCanonicalDocument.SourceData("repo-1", "git", "/tmp/repo", "https://example.test/repo.git", "main", "abc123", "2026-04-02T10:00:00Z"),
            new SnapshotCatalogCanonicalDocument.RunData("2026-04-02T10:00:00Z", "2026-04-02T10:01:00Z", "SUCCESS", List.of("java", "react")),
            new SnapshotCatalogCanonicalDocument.CompletenessData("COMPLETE", 10, 10, 0, List.of(), List.of()),
            List.of(),
            List.of(new SnapshotCatalogCanonicalDocument.EntityData("entity:1", "component", "declared", "BrowserView", "Browser View", "scope:ui", List.of(), Map.of("role", "ui"))),
            List.of(new SnapshotCatalogCanonicalDocument.RelationshipData(
                "rel:1",
                "DEPENDS_ON",
                "entity:1",
                "entity:2",
                "uses",
                List.of(),
                new SnapshotCatalogCanonicalDocument.NormalizedAssociationData("containment", "one-to-many", "1", "1", "0", "*", true, List.of("rel:field:1", "rel:field:2"), "entity:2", "owner", "entity:1", "children"),
                Map.of("framework", "jpa")
            )),
            new SnapshotCatalogCanonicalDocument.DependencyViewsData(
                List.of(new SnapshotCatalogCanonicalDocument.EntityAssociationRelationshipData(
                    "rel:1",
                    "rel:1",
                    "DEPENDS_ON",
                    "normalizedAssociation",
                    "jpa",
                    "relationship-catalog",
                    List.of("entity-model"),
                    "entity:1",
                    "BrowserView",
                    "entity:2",
                    "Search",
                    "uses",
                    "containment",
                    "one-to-many",
                    "1",
                    "1",
                    "0",
                    "*",
                    true,
                    "entity:2",
                    "owner",
                    "entity:1",
                    "children",
                    List.of("rel:field:1", "rel:field:2"),
                    2,
                    true,
                    true,
                    true,
                    "merged-bidirectional-peer-association"
                )),
                new SnapshotCatalogCanonicalDocument.RelationshipCatalogsData(
                    new SnapshotCatalogCanonicalDocument.RelationshipCatalogData(
                        "entityAssociationRelationships",
                        "Entity association relationships",
                        "Canonical normalized entity associations.",
                        "entity-associations",
                        "relationship-catalog",
                        "jpa",
                        List.of("jpa"),
                        List.of("entity-model"),
                        true,
                        1,
                        List.of("one-to-many"),
                        List.of("containment"),
                        true,
                        true,
                        true
                    )
                ),
                new SnapshotCatalogCanonicalDocument.JavaBrowserViewsData(
                    List.of(new SnapshotCatalogCanonicalDocument.JavaBrowserViewData(
                        "javaEntityModelGraph",
                        "Java entity model graph",
                        "JPA entity model graph",
                        "jpa",
                        "entity-model",
                        "entityModelTypeDependencies",
                        "entityModelModuleDependencies",
                        "entityAssociationRelationships",
                        List.of("hasAssociation"),
                        true,
                        0,
                        0,
                        1,
                        "entityAssociationRelationships",
                        "graph",
                        true,
                        List.of("DEPENDS_ON"),
                        List.of("jpa"),
                        List.of("entity-model")
                    )),
                    List.of("javaEntityModelGraph"),
                    "javaEntityModelGraph"
                )
            ),
            List.of(),
            List.of(),
            Map.of("schemaVersion", "1.4.0")
        );

        SourceInfo sourceInfo = mapper.toSourceInfo(canonical);
        FullEntity entity = mapper.mapEntities(canonical).getFirst();
        FullRelationship relationship = mapper.mapRelationships(canonical).getFirst();
        var dependencyViews = mapper.mapDependencyViews(canonical);

        assertEquals("repo-1", sourceInfo.repositoryId());
        assertEquals("BrowserView", entity.name());
        assertEquals("ui", entity.metadata().get("role"));
        assertEquals("one-to-many", relationship.normalizedAssociation().associationCardinality());
        assertEquals(List.of("rel:field:1", "rel:field:2"), relationship.normalizedAssociation().evidenceRelationshipIds());
        assertEquals(1, dependencyViews.entityAssociationRelationships().size());
        assertEquals("entityAssociationRelationships", dependencyViews.relationshipCatalogs().entityAssociations().id());
        assertEquals("entityAssociationRelationships", dependencyViews.javaBrowserViews().views().getFirst().preferredDependencyView());
    }

    @Test
    void mapsNullDependencyViewSectionsToSafeDefaults() {
        SnapshotCatalogCanonicalDocument canonical = new SnapshotCatalogCanonicalDocument(
            new SnapshotCatalogCanonicalDocument.SourceData(null, null, null, null, null, null, null),
            new SnapshotCatalogCanonicalDocument.RunData(null, null, null, List.of()),
            new SnapshotCatalogCanonicalDocument.CompletenessData(null, 0, 0, 0, List.of(), List.of()),
            List.of(),
            List.of(),
            List.of(new SnapshotCatalogCanonicalDocument.RelationshipData("rel:1", "DEPENDS_ON", "entity:1", "entity:2", null, List.of(), null, Map.of())),
            new SnapshotCatalogCanonicalDocument.DependencyViewsData(List.of(), new SnapshotCatalogCanonicalDocument.RelationshipCatalogsData(null), new SnapshotCatalogCanonicalDocument.JavaBrowserViewsData(List.of(), List.of(), null)),
            List.of(),
            List.of(),
            Map.of()
        );

        FullRelationship relationship = mapper.mapRelationships(canonical).getFirst();
        var dependencyViews = mapper.mapDependencyViews(canonical);

        assertNull(relationship.normalizedAssociation());
        assertEquals(List.of(), dependencyViews.entityAssociationRelationships());
        assertNull(dependencyViews.relationshipCatalogs().entityAssociations());
        assertEquals(List.of(), dependencyViews.javaBrowserViews().views());
    }
}
