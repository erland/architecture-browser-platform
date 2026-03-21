package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullDiagnostic;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullScope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullViewpoint;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SourceInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SourceRef;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
class SnapshotCatalogDocumentMapper {
    @Inject
    SnapshotCatalogMetadataSanitizer metadataSanitizer;

    SourceInfo toSourceInfo(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.RepositorySource source = document.source();
        if (source == null) {
            return new SourceInfo(null, null, null, null, null, null, null);
        }
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

    RunInfo toRunInfo(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.RunMetadata runMetadata = document.runMetadata();
        if (runMetadata == null) {
            return new RunInfo(null, null, null, List.of());
        }
        return new RunInfo(
            runMetadata.startedAt(),
            runMetadata.completedAt(),
            runMetadata.outcome(),
            Optional.ofNullable(runMetadata.detectedTechnologies()).orElse(List.of())
        );
    }

    CompletenessInfo toCompletenessInfo(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.CompletenessMetadata completeness = document.completeness();
        if (completeness == null) {
            return new CompletenessInfo(null, 0, 0, 0, List.of(), List.of());
        }
        return new CompletenessInfo(
            completeness.status(),
            completeness.indexedFileCount(),
            completeness.totalFileCount(),
            completeness.degradedFileCount(),
            Optional.ofNullable(completeness.omittedPaths()).orElse(List.of()),
            Optional.ofNullable(completeness.notes()).orElse(List.of())
        );
    }

    List<FullScope> mapScopes(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.scopes()).orElse(List.of()).stream()
            .map(scope -> new FullScope(
                scope.id(),
                scope.kind(),
                scope.name(),
                scope.displayName(),
                scope.parentScopeId(),
                mapSourceRefs(scope.sourceRefs()),
                metadataSanitizer.defaultMap(scope.metadata())
            ))
            .toList();
    }

    List<FullEntity> mapEntities(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.entities()).orElse(List.of()).stream()
            .map(entity -> new FullEntity(
                entity.id(),
                entity.kind(),
                entity.origin(),
                entity.name(),
                entity.displayName(),
                entity.scopeId(),
                mapSourceRefs(entity.sourceRefs()),
                metadataSanitizer.defaultMap(entity.metadata())
            ))
            .toList();
    }

    List<FullRelationship> mapRelationships(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.relationships()).orElse(List.of()).stream()
            .map(relationship -> new FullRelationship(
                relationship.id(),
                relationship.kind(),
                relationship.fromEntityId(),
                relationship.toEntityId(),
                relationship.label(),
                mapSourceRefs(relationship.sourceRefs()),
                metadataSanitizer.defaultMap(relationship.metadata())
            ))
            .toList();
    }

    List<FullViewpoint> mapViewpoints(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.viewpoints()).orElse(List.of()).stream()
            .map(viewpoint -> new FullViewpoint(
                viewpoint.id(),
                viewpoint.title(),
                viewpoint.description(),
                viewpoint.availability(),
                viewpoint.confidence() != null ? viewpoint.confidence() : 0.0d,
                defaultList(viewpoint.seedEntityIds()),
                defaultList(viewpoint.seedRoleIds()),
                defaultList(viewpoint.expandViaSemantics()),
                defaultList(viewpoint.preferredDependencyViews()),
                defaultList(viewpoint.evidenceSources())
            ))
            .toList();
    }

    List<FullDiagnostic> mapDiagnostics(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.diagnostics()).orElse(List.of()).stream()
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
                metadataSanitizer.defaultMap(diagnostic.metadata())
            ))
            .toList();
    }

    List<SourceRef> mapSourceRefs(List<ArchitectureIndexDocument.SourceReference> sourceRefs) {
        return Optional.ofNullable(sourceRefs).orElse(List.of()).stream()
            .map(sourceRef -> new SourceRef(
                sourceRef.path(),
                sourceRef.startLine(),
                sourceRef.endLine(),
                sourceRef.snippet(),
                metadataSanitizer.defaultMap(sourceRef.metadata())
            ))
            .toList();
    }

    Map<String, Object> metadataEnvelope(ArchitectureIndexDocument document) {
        return metadataSanitizer.defaultMap(document.metadata());
    }

    private List<String> defaultList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return List.copyOf(values);
    }
}
