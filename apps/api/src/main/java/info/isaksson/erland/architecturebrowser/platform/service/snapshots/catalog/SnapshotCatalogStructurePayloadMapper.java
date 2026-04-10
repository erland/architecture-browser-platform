package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullNormalizedAssociation;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullScope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
class SnapshotCatalogStructurePayloadMapper {
    SnapshotCatalogSourceRefMapper sourceRefMapper;

    SnapshotCatalogStructurePayloadMapper() {
        this(new SnapshotCatalogSourceRefMapper());
    }

    @Inject
    SnapshotCatalogStructurePayloadMapper(SnapshotCatalogSourceRefMapper sourceRefMapper) {
        this.sourceRefMapper = sourceRefMapper;
    }

    List<FullScope> mapScopes(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.scopes().stream()
            .map(scope -> new FullScope(
                scope.id(),
                scope.kind(),
                scope.name(),
                scope.displayName(),
                scope.parentScopeId(),
                sourceRefMapper.mapSourceRefs(scope.sourceRefs()),
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
                sourceRefMapper.mapSourceRefs(entity.sourceRefs()),
                entity.architecturalRoles(),
                entity.architecturalTraits(),
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
                sourceRefMapper.mapSourceRefs(relationship.sourceRefs()),
                mapNormalizedAssociation(relationship.normalizedAssociation()),
                relationship.metadata()
            ))
            .toList();
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
}
