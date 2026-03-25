package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.contract.ContractValidationResult;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class SnapshotImportDocumentParser {
    @Inject
    IndexerImportContractValidator contractValidator;

    @Inject
    SnapshotImportSemanticValidator semanticValidator;

    @Inject
    ObjectMapper objectMapper;

    public ArchitectureIndexDocument validateAndParse(JsonNode payload) {
        ContractValidationResult contractResult = contractValidator.validate(payload);
        if (!contractResult.valid()) {
            throw new ValidationException(contractResult.errors());
        }
        ArchitectureIndexDocument document = objectMapper.convertValue(payload, ArchitectureIndexDocument.class);
        semanticValidator.validate(document);
        return document;
    }
}
