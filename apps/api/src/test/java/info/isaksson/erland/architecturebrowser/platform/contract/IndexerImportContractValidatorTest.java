package info.isaksson.erland.architecturebrowser.platform.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.service.IndexerImportContractValidator;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class IndexerImportContractValidatorTest {
    @Inject
    IndexerImportContractValidator validator;

    @Inject
    ObjectMapper objectMapper;

    @Test
    void validatesMinimalSuccessFixture() throws Exception {
        JsonNode payload = read("/contracts/minimal-success.json");
        ContractValidationResult result = validator.validate(payload);
        assertTrue(result.valid(), () -> String.join("\n", result.errors()));
    }

    @Test
    void rejectsBrokenFixture() throws Exception {
        JsonNode payload = read("/contracts/invalid-missing-source.json");
        ContractValidationResult result = validator.validate(payload);
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(message -> message.contains("source")));
    }

    private JsonNode read(String resourcePath) throws Exception {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            assertNotNull(inputStream, "Missing resource " + resourcePath);
            return objectMapper.readTree(inputStream);
        }
    }
}
