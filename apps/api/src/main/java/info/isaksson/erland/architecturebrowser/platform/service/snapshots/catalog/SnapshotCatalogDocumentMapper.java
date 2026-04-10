package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDependencyViews;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDiagnostic;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullRelationship;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullScope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullViewpoint;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
class SnapshotCatalogDocumentMapper {
    SnapshotCatalogStructurePayloadMapper structurePayloadMapper;

    SnapshotCatalogDependencyViewsPayloadMapper dependencyViewsPayloadMapper;

    SnapshotCatalogInsightsPayloadMapper insightsPayloadMapper;

    SnapshotCatalogDocumentMapper() {
        this(
            new SnapshotCatalogStructurePayloadMapper(),
            new SnapshotCatalogDependencyViewsPayloadMapper(),
            new SnapshotCatalogInsightsPayloadMapper()
        );
    }

    @Inject
    SnapshotCatalogDocumentMapper(
        SnapshotCatalogStructurePayloadMapper structurePayloadMapper,
        SnapshotCatalogDependencyViewsPayloadMapper dependencyViewsPayloadMapper,
        SnapshotCatalogInsightsPayloadMapper insightsPayloadMapper
    ) {
        this.structurePayloadMapper = structurePayloadMapper;
        this.dependencyViewsPayloadMapper = dependencyViewsPayloadMapper;
        this.insightsPayloadMapper = insightsPayloadMapper;
    }

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
        return structurePayloadMapper.mapScopes(canonicalDocument);
    }

    List<FullEntity> mapEntities(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return structurePayloadMapper.mapEntities(canonicalDocument);
    }

    List<FullRelationship> mapRelationships(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return structurePayloadMapper.mapRelationships(canonicalDocument);
    }

    FullDependencyViews mapDependencyViews(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return dependencyViewsPayloadMapper.mapDependencyViews(canonicalDocument);
    }

    List<FullViewpoint> mapViewpoints(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return insightsPayloadMapper.mapViewpoints(canonicalDocument);
    }

    List<FullDiagnostic> mapDiagnostics(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return insightsPayloadMapper.mapDiagnostics(canonicalDocument);
    }

    Map<String, Object> metadataEnvelope(SnapshotCatalogCanonicalDocument canonicalDocument) {
        return canonicalDocument.metadata();
    }
}
