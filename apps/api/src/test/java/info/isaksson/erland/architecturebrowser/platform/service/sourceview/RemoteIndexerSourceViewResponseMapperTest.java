package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.Optional;
import javax.net.ssl.SSLSession;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RemoteIndexerSourceViewResponseMapperTest {
    @Test
    void mapsSuccessfulSourceReadResponse() throws Exception {
        RemoteIndexerSourceViewResponseMapper mapper = new RemoteIndexerSourceViewResponseMapper();
        mapper.objectMapper = new ObjectMapper();

        SourceViewReadResponse response = mapper.map(new StaticHttpResponse("""
            {
              "sourceHandle": "src_123",
              "path": "src/App.tsx",
              "language": "tsx",
              "totalLineCount": 42,
              "fileSizeBytes": 512,
              "requestedStartLine": 10,
              "requestedEndLine": 20,
              "sourceText": "export const app = true;"
            }
            """));

        assertEquals("src_123", response.sourceHandle());
        assertEquals("src/App.tsx", response.path());
        assertEquals("tsx", response.language());
        assertEquals(42, response.totalLineCount());
        assertEquals(512L, response.fileSizeBytes());
        assertEquals(10, response.requestedStartLine());
        assertEquals(20, response.requestedEndLine());
        assertEquals("export const app = true;", response.sourceText());
    }

    @Test
    void allowsOptionalFieldsToBeAbsent() throws Exception {
        RemoteIndexerSourceViewResponseMapper mapper = new RemoteIndexerSourceViewResponseMapper();
        mapper.objectMapper = new ObjectMapper();

        SourceViewReadResponse response = mapper.map(new StaticHttpResponse("""
            {
              "sourceHandle": "src_123",
              "path": "src/App.tsx",
              "sourceText": "export const app = true;"
            }
            """));

        assertNull(response.language());
        assertNull(response.totalLineCount());
        assertNull(response.fileSizeBytes());
        assertNull(response.requestedStartLine());
        assertNull(response.requestedEndLine());
    }

    @Test
    void rejectsMissingRequiredFields() {
        RemoteIndexerSourceViewResponseMapper mapper = new RemoteIndexerSourceViewResponseMapper();
        mapper.objectMapper = new ObjectMapper();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
            () -> mapper.map(new StaticHttpResponse("{\"path\":\"src/App.tsx\"}")));

        assertTrue(ex.getMessage().contains("required field 'sourceHandle'"));
    }

    private record StaticHttpResponse(String responseBody) implements HttpResponse<String> {
        @Override public int statusCode() { return 200; }
        @Override public HttpRequest request() { return HttpRequest.newBuilder(URI.create("https://example.test")).build(); }
        @Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
        @Override public HttpHeaders headers() { return HttpHeaders.of(Map.of(), (a, b) -> true); }
        @Override public String body() { return responseBody; }
        @Override public Optional<SSLSession> sslSession() { return Optional.empty(); }
        @Override public URI uri() { return URI.create("https://example.test"); }
        @Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
    }
}
