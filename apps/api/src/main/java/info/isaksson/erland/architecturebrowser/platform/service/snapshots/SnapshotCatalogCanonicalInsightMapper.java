package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
class SnapshotCatalogCanonicalInsightMapper {
    @Inject
    SnapshotCatalogMetadataSanitizer metadataSanitizer;

    @Inject
    SnapshotCatalogCanonicalStructureMapper structureMapper;

    List<SnapshotCatalogCanonicalDocument.ViewpointData> viewpoints(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.viewpoints()).orElse(List.of()).stream()
            .map(viewpoint -> new SnapshotCatalogCanonicalDocument.ViewpointData(
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

    List<SnapshotCatalogCanonicalDocument.DiagnosticData> diagnostics(ArchitectureIndexDocument document) {
        return Optional.ofNullable(document.diagnostics()).orElse(List.of()).stream()
            .map(diagnostic -> new SnapshotCatalogCanonicalDocument.DiagnosticData(
                diagnostic.id(),
                diagnostic.severity(),
                diagnostic.phase(),
                diagnostic.code(),
                diagnostic.message(),
                diagnostic.fatal(),
                diagnostic.filePath(),
                diagnostic.scopeId(),
                diagnostic.entityId(),
                structureMapper.sourceRefs(diagnostic.sourceRefs()),
                metadataSanitizer.defaultMap(diagnostic.metadata())
            ))
            .toList();
    }

    private List<String> defaultList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return List.copyOf(values);
    }
}
