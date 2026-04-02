package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDiagnostic;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationship;
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
                relationship.metadata()
            ))
            .toList();
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
