package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
class SnapshotCatalogDocumentReader {
    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    ArchitectureIndexDocument parseDocument(String rawPayloadJson) {
        try {
            JsonNode payload = jsonSupport.readTree(rawPayloadJson);
            return objectMapper.convertValue(payload, ArchitectureIndexDocument.class);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Stored snapshot payload could not be parsed.", ex);
        }
    }
}
