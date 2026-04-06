package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RemoteIndexerSourceViewRequestFactoryTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildsRequestPayload() throws Exception {
        RemoteIndexerSourceViewRequestFactory factory = new RemoteIndexerSourceViewRequestFactory();
        factory.jsonSupport = newJsonSupport();

        String json = factory.buildRequestBody(new SourceViewReadRequest(" src_123 ", " src/App.tsx ", 10, 20));
        JsonNode payload = objectMapper.readTree(json);

        assertEquals("src_123", payload.path("sourceHandle").asText());
        assertEquals("src/App.tsx", payload.path("path").asText());
        assertEquals(10, payload.path("startLine").asInt());
        assertEquals(20, payload.path("endLine").asInt());
    }

    @Test
    void omitsOptionalRangeWhenAbsent() throws Exception {
        RemoteIndexerSourceViewRequestFactory factory = new RemoteIndexerSourceViewRequestFactory();
        factory.jsonSupport = newJsonSupport();

        String json = factory.buildRequestBody(new SourceViewReadRequest("src_123", "src/App.tsx", null, null));
        JsonNode payload = objectMapper.readTree(json);

        assertFalse(payload.has("startLine"));
        assertFalse(payload.has("endLine"));
    }

    @Test
    void rejectsBlankRequiredFields() throws Exception {
        RemoteIndexerSourceViewRequestFactory factory = new RemoteIndexerSourceViewRequestFactory();
        factory.jsonSupport = newJsonSupport();

        assertThrows(IllegalArgumentException.class,
            () -> factory.buildRequestBody(new SourceViewReadRequest(" ", "src/App.tsx", null, null)));
        assertThrows(IllegalArgumentException.class,
            () -> factory.buildRequestBody(new SourceViewReadRequest("src_123", " ", null, null)));
    }

    private JsonSupport newJsonSupport() throws Exception {
        JsonSupport jsonSupport = new JsonSupport();
        var field = JsonSupport.class.getDeclaredField("objectMapper");
        field.setAccessible(true);
        field.set(jsonSupport, objectMapper);
        return jsonSupport;
    }
}
