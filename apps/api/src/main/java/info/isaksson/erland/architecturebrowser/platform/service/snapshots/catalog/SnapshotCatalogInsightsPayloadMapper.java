package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullDiagnostic;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullViewpoint;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
class SnapshotCatalogInsightsPayloadMapper {
    SnapshotCatalogSourceRefMapper sourceRefMapper;

    SnapshotCatalogInsightsPayloadMapper() {
        this(new SnapshotCatalogSourceRefMapper());
    }

    @Inject
    SnapshotCatalogInsightsPayloadMapper(SnapshotCatalogSourceRefMapper sourceRefMapper) {
        this.sourceRefMapper = sourceRefMapper;
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
                sourceRefMapper.mapSourceRefs(diagnostic.sourceRefs()),
                diagnostic.metadata()
            ))
            .toList();
    }
}
