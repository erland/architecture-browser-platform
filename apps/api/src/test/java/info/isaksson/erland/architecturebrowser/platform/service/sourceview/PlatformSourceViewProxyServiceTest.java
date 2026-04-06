package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.runs.RemoteIndexerTransport;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.Optional;
import javax.net.ssl.SSLSession;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlatformSourceViewProxyServiceTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void proxiesSourceReadToIndexerWorker() throws Exception {
        PlatformSourceViewProxyService service = new PlatformSourceViewProxyService();
        service.baseUrl = "https://indexer.test/base/";
        service.connectTimeoutSeconds = 5;
        service.readTimeoutSeconds = 15;
        service.requestFactory = newRequestFactory();
        service.responseMapper = newResponseMapper();
        service.errorMapper = new RemoteIndexerSourceViewErrorMapper();
        RecordingTransport transport = new RecordingTransport(new StaticHttpResponse(200, """
            {
              "sourceHandle": "src_123",
              "path": "src/App.tsx",
              "language": "tsx",
              "sourceText": "export const app = true;"
            }
            """));
        service.transport = transport;

        SourceViewReadResponse response = service.readSourceFile(new SourceViewReadRequest("src_123", "src/App.tsx", 3, 8));

        assertEquals("https://indexer.test/base/api/source-files/read", transport.endpoint);
        assertEquals(5L, transport.connectTimeoutSeconds);
        assertEquals(15L, transport.readTimeoutSeconds);
        JsonNode payload = objectMapper.readTree(transport.requestJson);
        assertEquals("src_123", payload.path("sourceHandle").asText());
        assertEquals("src/App.tsx", payload.path("path").asText());
        assertEquals(3, payload.path("startLine").asInt());
        assertEquals(8, payload.path("endLine").asInt());
        assertEquals("tsx", response.language());
    }

    @Test
    void mapsHttpFailures() throws Exception {
        PlatformSourceViewProxyService service = new PlatformSourceViewProxyService();
        service.baseUrl = "https://indexer.test";
        service.connectTimeoutSeconds = 5;
        service.readTimeoutSeconds = 15;
        service.requestFactory = newRequestFactory();
        service.responseMapper = newResponseMapper();
        service.errorMapper = new RemoteIndexerSourceViewErrorMapper();
        service.transport = new RecordingTransport(new StaticHttpResponse(410, "handle expired"));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
            () -> service.readSourceFile(new SourceViewReadRequest("src_123", "src/App.tsx", null, null)));

        assertTrue(ex.getMessage().contains("HTTP 410"));
        assertTrue(ex.getMessage().contains("handle expired"));
    }

    @Test
    void mapsIoFailures() throws Exception {
        PlatformSourceViewProxyService service = new PlatformSourceViewProxyService();
        service.baseUrl = "https://indexer.test";
        service.connectTimeoutSeconds = 5;
        service.readTimeoutSeconds = 15;
        service.requestFactory = newRequestFactory();
        service.responseMapper = newResponseMapper();
        service.errorMapper = new RemoteIndexerSourceViewErrorMapper();
        service.transport = new FailingTransport();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
            () -> service.readSourceFile(new SourceViewReadRequest("src_123", "src/App.tsx", null, null)));

        assertTrue(ex.getMessage().contains("Failed to communicate with the indexer source view endpoint"));
        assertTrue(ex.getCause() instanceof IOException);
    }

    private RemoteIndexerSourceViewRequestFactory newRequestFactory() throws Exception {
        RemoteIndexerSourceViewRequestFactory factory = new RemoteIndexerSourceViewRequestFactory();
        JsonSupport jsonSupport = new JsonSupport();
        var jsonSupportMapperField = JsonSupport.class.getDeclaredField("objectMapper");
        jsonSupportMapperField.setAccessible(true);
        jsonSupportMapperField.set(jsonSupport, objectMapper);
        factory.jsonSupport = jsonSupport;
        return factory;
    }

    private RemoteIndexerSourceViewResponseMapper newResponseMapper() {
        RemoteIndexerSourceViewResponseMapper mapper = new RemoteIndexerSourceViewResponseMapper();
        mapper.objectMapper = objectMapper;
        return mapper;
    }

    private static final class RecordingTransport extends RemoteIndexerTransport {
        private final HttpResponse<String> response;
        private String endpoint;
        private String requestJson;
        private long connectTimeoutSeconds;
        private long readTimeoutSeconds;

        private RecordingTransport(HttpResponse<String> response) {
            this.response = response;
        }

        @Override
        public HttpResponse<String> postJson(String endpoint, String requestJson, long connectTimeoutSeconds, long readTimeoutSeconds) {
            this.endpoint = endpoint;
            this.requestJson = requestJson;
            this.connectTimeoutSeconds = connectTimeoutSeconds;
            this.readTimeoutSeconds = readTimeoutSeconds;
            return response;
        }
    }

    private static final class FailingTransport extends RemoteIndexerTransport {
        @Override
        public HttpResponse<String> postJson(String endpoint, String requestJson, long connectTimeoutSeconds, long readTimeoutSeconds) throws IOException {
            throw new IOException("socket closed");
        }
    }

    private record StaticHttpResponse(int statusCode, String responseBody) implements HttpResponse<String> {
        @Override public HttpRequest request() { return HttpRequest.newBuilder(URI.create("https://example.test")).build(); }
        @Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
        @Override public HttpHeaders headers() { return HttpHeaders.of(Map.of(), (a, b) -> true); }
        @Override public String body() { return responseBody; }
        @Override public Optional<SSLSession> sslSession() { return Optional.empty(); }
        @Override public URI uri() { return URI.create("https://example.test"); }
        @Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
    }
}
