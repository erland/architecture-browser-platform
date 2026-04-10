package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDependencyViews;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntityAssociationRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullJavaBrowserView;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullJavaBrowserViews;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationshipCatalog;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationshipCatalogs;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
class SnapshotCatalogDependencyViewsPayloadMapper {
    FullDependencyViews mapDependencyViews(SnapshotCatalogCanonicalDocument canonicalDocument) {
        SnapshotCatalogCanonicalDocument.DependencyViewsData dependencyViews = canonicalDocument.dependencyViews();
        return new FullDependencyViews(
            dependencyViews.entityAssociationRelationships().stream()
                .map(relationship -> new FullEntityAssociationRelationship(
                    relationship.relationshipId(),
                    relationship.canonicalRelationshipId(),
                    relationship.relationshipKind(),
                    relationship.relationshipType(),
                    relationship.framework(),
                    relationship.browserViewKind(),
                    relationship.architectureViewKinds(),
                    relationship.sourceEntityId(),
                    relationship.sourceEntityName(),
                    relationship.targetEntityId(),
                    relationship.targetEntityName(),
                    relationship.label(),
                    relationship.associationKind(),
                    relationship.associationCardinality(),
                    relationship.sourceLowerBound(),
                    relationship.sourceUpperBound(),
                    relationship.targetLowerBound(),
                    relationship.targetUpperBound(),
                    relationship.bidirectional(),
                    relationship.owningSideEntityId(),
                    relationship.owningSideMemberId(),
                    relationship.inverseSideEntityId(),
                    relationship.inverseSideMemberId(),
                    relationship.evidenceRelationshipIds(),
                    relationship.evidenceRelationshipCount(),
                    relationship.recommendedForArchitectureViews(),
                    relationship.canonicalForEntityViews(),
                    relationship.rawRelationshipEvidenceRetained(),
                    relationship.jpaAssociationHandling()
                ))
                .toList(),
            mapRelationshipCatalogs(dependencyViews.relationshipCatalogs()),
            mapJavaBrowserViews(dependencyViews.javaBrowserViews())
        );
    }

    private FullRelationshipCatalogs mapRelationshipCatalogs(SnapshotCatalogCanonicalDocument.RelationshipCatalogsData relationshipCatalogs) {
        if (relationshipCatalogs == null) {
            return new FullRelationshipCatalogs(null);
        }
        SnapshotCatalogCanonicalDocument.RelationshipCatalogData entityAssociations = relationshipCatalogs.entityAssociations();
        return new FullRelationshipCatalogs(
            entityAssociations == null ? null : new FullRelationshipCatalog(
                entityAssociations.id(),
                entityAssociations.title(),
                entityAssociations.description(),
                entityAssociations.relationshipCatalogKind(),
                entityAssociations.browserViewKind(),
                entityAssociations.framework(),
                entityAssociations.frameworks(),
                entityAssociations.architectureViewKinds(),
                entityAssociations.available(),
                entityAssociations.relationshipCount(),
                entityAssociations.associationCardinalities(),
                entityAssociations.associationKinds(),
                entityAssociations.recommendedForArchitectureViews(),
                entityAssociations.canonicalForEntityViews(),
                entityAssociations.retainsRawRelationshipEvidence()
            )
        );
    }

    private FullJavaBrowserViews mapJavaBrowserViews(SnapshotCatalogCanonicalDocument.JavaBrowserViewsData javaBrowserViews) {
        if (javaBrowserViews == null) {
            return new FullJavaBrowserViews(List.of(), List.of(), null);
        }
        return new FullJavaBrowserViews(
            javaBrowserViews.views().stream()
                .map(view -> new FullJavaBrowserView(
                    view.id(),
                    view.title(),
                    view.description(),
                    view.framework(),
                    view.architectureViewKind(),
                    view.typeDependencyView(),
                    view.moduleDependencyView(),
                    view.relationshipCatalogView(),
                    view.frameworkRelationships(),
                    view.available(),
                    view.typeDependencyCount(),
                    view.moduleDependencyCount(),
                    view.relationshipCatalogCount(),
                    view.preferredDependencyView(),
                    view.browserViewKind(),
                    view.recommendedForArchitectureViews(),
                    view.relationshipKinds(),
                    view.availableFrameworks(),
                    view.availableArchitectureViewKinds()
                ))
                .toList(),
            javaBrowserViews.availableViews(),
            javaBrowserViews.defaultViewId()
        );
    }
}
