package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
class SnapshotCatalogCanonicalDocumentMapper {
    @Inject
    SnapshotCatalogCanonicalCoreMapper coreMapper;

    @Inject
    SnapshotCatalogCanonicalStructureMapper structureMapper;

    @Inject
    SnapshotCatalogCanonicalInsightMapper insightMapper;

    @Inject
    SnapshotCatalogMetadataSanitizer metadataSanitizer;

    SnapshotCatalogCanonicalDocument toCanonicalDocument(ArchitectureIndexDocument document) {
        return new SnapshotCatalogCanonicalDocument(
            coreMapper.source(document),
            coreMapper.run(document),
            coreMapper.completeness(document),
            structureMapper.scopes(document),
            structureMapper.entities(document),
            structureMapper.relationships(document),
            insightMapper.viewpoints(document),
            insightMapper.diagnostics(document),
            metadataSanitizer.defaultMap(document.metadata())
        );
    }
}
