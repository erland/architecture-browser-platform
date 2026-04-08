package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDependencyViews;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDiagnostic;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntityAssociationRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullJavaBrowserView;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullJavaBrowserViews;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullNormalizedAssociation;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationshipCatalog;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationshipCatalogs;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullScope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullViewpoint;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceRef;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;

@ApplicationScoped
class SnapshotCatalogDocumentMapper {
    SourceInfo toSourceInfo(SnapshotCatalogCanonicalDocument canonicalDocument) {
        SnapshotCatalogCanonicalDocument.SourceData source = canonicalDocument.source();
        return new SourceInfo(
            source.repositoryId(),
            source.acquisitionType(),
            source.path(),
            source.remoteUrl(),
            source.branch(),
            source.revision(),
            source.acquiredAt()
        );
    }

    RunInfo toRunInfo(SnapshotCatalogCanonicalDocument canonicalDocument) {
        SnapshotCatalogCanonicalDocument.RunData run = canonicalDocument.run();
        return new RunInfo(
            run.startedAt(),
            run.completedAt(),
            run.outcome(),
            run.detectedTechnologies()
        );
    }

    CompletenessInfo toCompletenessInfo(SnapshotCatalogCanonicalDocument canonicalDocument) {
        SnapshotCatalogCanonicalDocument.CompletenessData completeness = canonicalDocument.completeness();
        return new CompletenessInfo(
            completeness.status(),
            completeness.indexedFileCount(),
            completeness.totalFileCount(),
            completeness.degradedFileCount(),
            completeness.omittedPaths(),
            completeness.notes()
        );
    }

    List<FullScope> mapScopes(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.scopes().stream()
            .map(scope -> new FullScope(
                scope.id(),
                scope.kind(),
                scope.name(),
                scope.displayName(),
                scope.parentScopeId(),
                mapSourceRefs(scope.sourceRefs()),
                scope.metadata()
            ))
            .toList();
    }

    List<FullEntity> mapEntities(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.entities().stream()
            .map(entity -> new FullEntity(
                entity.id(),
                entity.kind(),
                entity.origin(),
                entity.name(),
                entity.displayName(),
                entity.scopeId(),
                mapSourceRefs(entity.sourceRefs()),
                entity.metadata()
            ))
            .toList();
    }

    List<FullRelationship> mapRelationships(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.relationships().stream()
            .map(relationship -> new FullRelationship(
                relationship.id(),
                relationship.kind(),
                relationship.fromEntityId(),
                relationship.toEntityId(),
                relationship.label(),
                mapSourceRefs(relationship.sourceRefs()),
                mapNormalizedAssociation(relationship.normalizedAssociation()),
                relationship.metadata()
            ))
            .toList();
    }

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

    List<FullViewpoint> mapViewpoints(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.viewpoints().stream()
            .map(viewpoint -> new FullViewpoint(
                viewpoint.id(),
                viewpoint.title(),
                viewpoint.description(),
                viewpoint.availability(),
                viewpoint.confidence(),
                viewpoint.seedEntityIds(),
                viewpoint.seedRoleIds(),
                viewpoint.expandViaSemantics(),
                viewpoint.preferredDependencyViews(),
                viewpoint.evidenceSources()
            ))
            .toList();
    }

    List<FullDiagnostic> mapDiagnostics(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.diagnostics().stream()
            .map(diagnostic -> new FullDiagnostic(
                diagnostic.id(),
                diagnostic.severity(),
                diagnostic.phase(),
                diagnostic.code(),
                diagnostic.message(),
                diagnostic.fatal(),
                diagnostic.filePath(),
                diagnostic.scopeId(),
                diagnostic.entityId(),
                mapSourceRefs(diagnostic.sourceRefs()),
                diagnostic.metadata()
            ))
            .toList();
    }

    Map<String, Object> metadataEnvelope(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.metadata();
    }

    private FullNormalizedAssociation mapNormalizedAssociation(SnapshotCatalogCanonicalDocument.NormalizedAssociationData normalizedAssociation) {
        if (normalizedAssociation == null) {
            return null;
        }
        return new FullNormalizedAssociation(
            normalizedAssociation.associationKind(),
            normalizedAssociation.associationCardinality(),
            normalizedAssociation.sourceLowerBound(),
            normalizedAssociation.sourceUpperBound(),
            normalizedAssociation.targetLowerBound(),
            normalizedAssociation.targetUpperBound(),
            normalizedAssociation.bidirectional(),
            normalizedAssociation.evidenceRelationshipIds(),
            normalizedAssociation.owningSideEntityId(),
            normalizedAssociation.owningSideMemberId(),
            normalizedAssociation.inverseSideEntityId(),
            normalizedAssociation.inverseSideMemberId()
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

    private List<SourceRef> mapSourceRefs(List<SnapshotCatalogCanonicalDocument.SourceRefData> sourceRefs) {
        return sourceRefs.stream()
            .map(sourceRef -> new SourceRef(
                sourceRef.path(),
                sourceRef.startLine(),
                sourceRef.endLine(),
                sourceRef.snippet(),
                sourceRef.metadata()
            ))
            .toList();
    }
}
