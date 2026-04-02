package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class SnapshotCatalogPayloadLoader {
    @Inject
    SnapshotCatalogDocumentReader documentReader;

    @Inject
    SnapshotCatalogCanonicalDocumentMapper canonicalDocumentMapper;

    public SnapshotCatalogDocumentContext load(SnapshotEntity snapshot, SnapshotCatalogSummaryProjection summary) {
        ArchitectureIndexDocument document = documentReader.parseDocument(snapshot.rawPayloadJson);
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshot.id);
        SnapshotCatalogCanonicalDocument canonicalDocument = canonicalDocumentMapper.toCanonicalDocument(document);
        return new SnapshotCatalogDocumentContext(snapshot, summary, document, canonicalDocument, facts);
    }

    public record SnapshotCatalogDocumentContext(
        SnapshotEntity snapshot,
        SnapshotCatalogSummaryProjection summary,
        ArchitectureIndexDocument document,
        SnapshotCatalogCanonicalDocument canonicalDocument,
        List<ImportedFactEntity> facts
    ) {
    }
}
