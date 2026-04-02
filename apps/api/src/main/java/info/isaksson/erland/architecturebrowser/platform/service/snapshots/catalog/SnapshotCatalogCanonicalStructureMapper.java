package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
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
                metadataSanitizer.defaultMap(entity.metadata())
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
                metadataSanitizer.defaultMap(relationship.metadata())
            ))
            .toList();
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
}
