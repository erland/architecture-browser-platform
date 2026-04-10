package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileImportArtifact;

public record SnapshotImportPreparedDocument(
    JsonNode payload,
    ArchitectureIndexDocument document,
    SnapshotSourceFileImportArtifact snapshotSourceFiles
) {
}
