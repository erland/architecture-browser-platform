package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SchemaValidatorsConfig;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import info.isaksson.erland.architecturebrowser.platform.contract.ContractValidationResult;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.io.InputStream;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class IndexerImportContractValidator {
    private static final String SCHEMA_RESOURCE = "/indexer-ir.schema.json";

    @Inject
    ObjectMapper objectMapper;

    private JsonSchema schema;

    @PostConstruct
    void init() throws IOException {
        try (InputStream inputStream = getClass().getResourceAsStream(SCHEMA_RESOURCE)) {
            if (inputStream == null) {
                throw new IllegalStateException("Missing schema resource " + SCHEMA_RESOURCE);
            }
            JsonNode schemaNode = objectMapper.readTree(inputStream);
            JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012);
            schema = factory.getSchema(schemaNode, SchemaValidatorsConfig.builder().build());
        }
    }

    public ContractValidationResult validate(JsonNode payload) {
        Set<ValidationMessage> messages = schema.validate(payload);
        if (messages.isEmpty()) {
            return ContractValidationResult.ok();
        }
        List<String> errors = messages.stream()
            .map(ValidationMessage::getMessage)
            .sorted(Comparator.naturalOrder())
            .toList();
        return ContractValidationResult.invalid(errors);
    }
}
