package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileImportArtifact;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileSidecarReader;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SnapshotImportDocumentPreparationService {
    @Inject
    SnapshotImportDocumentParser documentParser;

    @Inject
    SnapshotSourceFileSidecarReader snapshotSourceFileSidecarReader;

    public SnapshotImportPreparedDocument prepare(JsonNode payload) {
        ArchitectureIndexDocument document = documentParser.validateAndParse(payload);
        SnapshotSourceFileImportArtifact snapshotSourceFiles = snapshotSourceFileSidecarReader.readIfPresent(payload).orElse(null);
        return new SnapshotImportPreparedDocument(payload, document, snapshotSourceFiles);
    }
}
