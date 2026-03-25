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

    public SnapshotCatalogDocumentContext load(SnapshotEntity snapshot, SnapshotCatalogSummaryProjection summary) {
        ArchitectureIndexDocument document = documentReader.parseDocument(snapshot.rawPayloadJson);
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshot.id);
        return new SnapshotCatalogDocumentContext(snapshot, summary, document, facts);
    }

    public record SnapshotCatalogDocumentContext(
        SnapshotEntity snapshot,
        SnapshotCatalogSummaryProjection summary,
        ArchitectureIndexDocument document,
        List<ImportedFactEntity> facts
    ) {
    }
}
