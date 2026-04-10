package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
class SnapshotCatalogCanonicalStructureMapper {
    @Inject
    SnapshotCatalogMetadataSanitizer metadataSanitizer;

    List<SnapshotCatalogCanonicalDocument.ScopeData> scopes(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.scopes()).orElse(List.of()).stream()
            .map(scope -> new SnapshotCatalogCanonicalDocument.ScopeData(
                scope.id(),
                scope.kind(),
                scope.name(),
                scope.displayName(),
                scope.parentScopeId(),
                sourceRefs(scope.sourceRefs()),
                metadataSanitizer.defaultMap(scope.metadata())
            ))
            .toList();
    }

    List<SnapshotCatalogCanonicalDocument.EntityData> entities(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.entities()).orElse(List.of()).stream()
            .map(entity -> new SnapshotCatalogCanonicalDocument.EntityData(
                entity.id(),
                entity.kind(),
                entity.origin(),
                entity.name(),
                entity.displayName(),
                entity.scopeId(),
                sourceRefs(entity.sourceRefs()),
                defaultList(entity.architecturalRoles()),
                defaultList(entity.architecturalTraits()),
                entityMetadata(entity)
            ))
            .toList();
    }

    List<SnapshotCatalogCanonicalDocument.RelationshipData> relationships(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.relationships()).orElse(List.of()).stream()
            .map(relationship -> new SnapshotCatalogCanonicalDocument.RelationshipData(
                relationship.id(),
                relationship.kind(),
                relationship.fromEntityId(),
                relationship.toEntityId(),
                relationship.label(),
                sourceRefs(relationship.sourceRefs()),
                normalizedAssociation(relationship.normalizedAssociation()),
                metadataSanitizer.defaultMap(relationship.metadata())
            ))
            .toList();
    }

    SnapshotCatalogCanonicalDocument.DependencyViewsData dependencyViews(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.DependencyViews dependencyViews = document.dependencyViews();
        if (dependencyViews == null) {
            return new SnapshotCatalogCanonicalDocument.DependencyViewsData(
                List.of(),
                new SnapshotCatalogCanonicalDocument.RelationshipCatalogsData(null),
                new SnapshotCatalogCanonicalDocument.JavaBrowserViewsData(List.of(), List.of(), null)
            );
        }
        return new SnapshotCatalogCanonicalDocument.DependencyViewsData(
            Optional.ofNullable(dependencyViews.entityAssociationRelationships()).orElse(List.of()).stream()
                .map(relationship -> new SnapshotCatalogCanonicalDocument.EntityAssociationRelationshipData(
                    relationship.relationshipId(),
                    relationship.canonicalRelationshipId(),
                    relationship.relationshipKind(),
                    relationship.relationshipType(),
                    relationship.framework(),
                    relationship.browserViewKind(),
                    defaultList(relationship.architectureViewKinds()),
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
                    defaultList(relationship.evidenceRelationshipIds()),
                    relationship.evidenceRelationshipCount(),
                    relationship.recommendedForArchitectureViews(),
                    relationship.canonicalForEntityViews(),
                    relationship.rawRelationshipEvidenceRetained(),
                    relationship.jpaAssociationHandling()
                ))
                .toList(),
            relationshipCatalogs(dependencyViews.relationshipCatalogs()),
            javaBrowserViews(dependencyViews.javaBrowserViews())
        );
    }

    List<SnapshotCatalogCanonicalDocument.SourceRefData> sourceRefs(List<ArchitectureIndexDocument.SourceReference> sourceRefs) {
        return Optional.ofNullable(sourceRefs).orElse(List.of()).stream()
            .map(sourceRef -> new SnapshotCatalogCanonicalDocument.SourceRefData(
                sourceRef.path(),
                sourceRef.startLine(),
                sourceRef.endLine(),
                sourceRef.snippet(),
                metadataSanitizer.defaultMap(sourceRef.metadata())
            ))
            .toList();
    }

    private Map<String, Object> entityMetadata(ArchitectureIndexDocument.ArchitectureEntity entity) {
        Map<String, Object> metadata = new java.util.LinkedHashMap<>(metadataSanitizer.defaultMap(entity.metadata()));
        List<String> architecturalRoles = defaultList(entity.architecturalRoles());
        List<String> architecturalTraits = defaultList(entity.architecturalTraits());
        if (!architecturalRoles.isEmpty()) {
            metadata.put("architecturalRoles", architecturalRoles);
        }
        if (!architecturalTraits.isEmpty()) {
            metadata.put("architecturalTraits", architecturalTraits);
        }
        return Map.copyOf(metadata);
    }


    private SnapshotCatalogCanonicalDocument.NormalizedAssociationData normalizedAssociation(ArchitectureIndexDocument.NormalizedAssociation normalizedAssociation) {
        if (normalizedAssociation == null) {
            return null;
        }
        return new SnapshotCatalogCanonicalDocument.NormalizedAssociationData(
            normalizedAssociation.associationKind(),
            normalizedAssociation.associationCardinality(),
            normalizedAssociation.sourceLowerBound(),
            normalizedAssociation.sourceUpperBound(),
            normalizedAssociation.targetLowerBound(),
            normalizedAssociation.targetUpperBound(),
            normalizedAssociation.bidirectional(),
            defaultList(normalizedAssociation.evidenceRelationshipIds()),
            normalizedAssociation.owningSideEntityId(),
            normalizedAssociation.owningSideMemberId(),
            normalizedAssociation.inverseSideEntityId(),
            normalizedAssociation.inverseSideMemberId()
        );
    }

    private SnapshotCatalogCanonicalDocument.RelationshipCatalogsData relationshipCatalogs(ArchitectureIndexDocument.RelationshipCatalogs relationshipCatalogs) {
        if (relationshipCatalogs == null) {
            return new SnapshotCatalogCanonicalDocument.RelationshipCatalogsData(null);
        }
        ArchitectureIndexDocument.RelationshipCatalog entityAssociations = relationshipCatalogs.entityAssociations();
        return new SnapshotCatalogCanonicalDocument.RelationshipCatalogsData(
            entityAssociations == null ? null : new SnapshotCatalogCanonicalDocument.RelationshipCatalogData(
                entityAssociations.id(),
                entityAssociations.title(),
                entityAssociations.description(),
                entityAssociations.relationshipCatalogKind(),
                entityAssociations.browserViewKind(),
                entityAssociations.framework(),
                defaultList(entityAssociations.frameworks()),
                defaultList(entityAssociations.architectureViewKinds()),
                entityAssociations.available(),
                entityAssociations.relationshipCount(),
                defaultList(entityAssociations.associationCardinalities()),
                defaultList(entityAssociations.associationKinds()),
                entityAssociations.recommendedForArchitectureViews(),
                entityAssociations.canonicalForEntityViews(),
                entityAssociations.retainsRawRelationshipEvidence()
            )
        );
    }

    private SnapshotCatalogCanonicalDocument.JavaBrowserViewsData javaBrowserViews(ArchitectureIndexDocument.JavaBrowserViews javaBrowserViews) {
        if (javaBrowserViews == null) {
            return new SnapshotCatalogCanonicalDocument.JavaBrowserViewsData(List.of(), List.of(), null);
        }
        return new SnapshotCatalogCanonicalDocument.JavaBrowserViewsData(
            Optional.ofNullable(javaBrowserViews.views()).orElse(List.of()).stream()
                .map(view -> new SnapshotCatalogCanonicalDocument.JavaBrowserViewData(
                    view.id(),
                    view.title(),
                    view.description(),
                    view.framework(),
                    view.architectureViewKind(),
                    view.typeDependencyView(),
                    view.moduleDependencyView(),
                    view.relationshipCatalogView(),
                    defaultList(view.frameworkRelationships()),
                    view.available(),
                    view.typeDependencyCount(),
                    view.moduleDependencyCount(),
                    view.relationshipCatalogCount(),
                    view.preferredDependencyView(),
                    view.browserViewKind(),
                    view.recommendedForArchitectureViews(),
                    defaultList(view.relationshipKinds()),
                    defaultList(view.availableFrameworks()),
                    defaultList(view.availableArchitectureViewKinds())
                ))
                .toList(),
            defaultList(javaBrowserViews.availableViews()),
            javaBrowserViews.defaultViewId()
        );
    }

    private List<String> defaultList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return List.copyOf(values);
    }
}
