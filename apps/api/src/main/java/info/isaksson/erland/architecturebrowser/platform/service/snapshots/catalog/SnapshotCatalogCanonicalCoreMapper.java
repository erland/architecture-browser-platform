package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
class SnapshotCatalogCanonicalCoreMapper {
    SnapshotCatalogCanonicalDocument.SourceData source(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.RepositorySource source = document.source();
        if (source == null) {
            return new SnapshotCatalogCanonicalDocument.SourceData(null, null, null, null, null, null, null);
        }
        return new SnapshotCatalogCanonicalDocument.SourceData(
            source.repositoryId(),
            source.acquisitionType(),
            source.path(),
            source.remoteUrl(),
            source.branch(),
            source.revision(),
            source.acquiredAt()
        );
    }

    SnapshotCatalogCanonicalDocument.RunData run(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.RunMetadata runMetadata = document.runMetadata();
        if (runMetadata == null) {
            return new SnapshotCatalogCanonicalDocument.RunData(null, null, null, List.of());
        }
        return new SnapshotCatalogCanonicalDocument.RunData(
            runMetadata.startedAt(),
            runMetadata.completedAt(),
            runMetadata.outcome(),
            Optional.ofNullable(runMetadata.detectedTechnologies()).orElse(List.of())
        );
    }

    SnapshotCatalogCanonicalDocument.CompletenessData completeness(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.CompletenessMetadata completeness = document.completeness();
        if (completeness == null) {
            return new SnapshotCatalogCanonicalDocument.CompletenessData(null, 0, 0, 0, List.of(), List.of());
        }
        return new SnapshotCatalogCanonicalDocument.CompletenessData(
            completeness.status(),
            completeness.indexedFileCount(),
            completeness.totalFileCount(),
            completeness.degradedFileCount(),
            Optional.ofNullable(completeness.omittedPaths()).orElse(List.of()),
            Optional.ofNullable(completeness.notes()).orElse(List.of())
        );
    }
}
