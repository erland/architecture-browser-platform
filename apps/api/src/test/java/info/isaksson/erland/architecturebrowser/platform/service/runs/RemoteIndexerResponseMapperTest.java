package info.isaksson.erland.architecturebrowser.platform.service.runs;

import com.fasterxml.jackson.databind.JsonNode;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RemoteIndexerResponseMapperTest {
    @Test
    void enrichesDocumentWithWorkerMetadata() throws Exception {
        RemoteIndexerResponseMapper mapper = new RemoteIndexerResponseMapper();
        mapper.objectMapper = new ObjectMapper();

        HttpResponse<String> response = new StaticHttpResponse("""
            {
              "jobId": "job-123",
              "status": "COMPLETED",
              "outputPath": "/tmp/output",
              "summary": {"files": 42},
              "manifest": {"version": "v1"},
              "sourceAccess": {
                "sourceHandle": "src_123",
                "accessMode": "RETAINED_ROOT",
                "retentionCategory": "git-retained-checkout"
              },
              "document": {"entities": []}
            }
            """);

        JsonNode document = mapper.requireDocument(response);

        JsonNode metadata = document.path("runMetadata").path("metadata");
        assertEquals("remote-http", metadata.path("indexerGateway").asText());
        assertEquals("job-123", metadata.path("indexerJobId").asText());
        assertEquals("COMPLETED", metadata.path("workerStatus").asText());
        assertEquals("/tmp/output", metadata.path("outputPath").asText());
        assertEquals(42, metadata.path("workerSummary").path("files").asInt());
        assertEquals("v1", metadata.path("workerManifest").path("version").asText());
        assertEquals("src_123", metadata.path("sourceAccess").path("sourceHandle").asText());
        assertEquals("RETAINED_ROOT", metadata.path("sourceAccess").path("accessMode").asText());
        assertEquals("git-retained-checkout", metadata.path("sourceAccess").path("retentionCategory").asText());
    }


    @Test
    void leavesSourceAccessAbsentWhenWorkerDidNotReturnIt() throws Exception {
        RemoteIndexerResponseMapper mapper = new RemoteIndexerResponseMapper();
        mapper.objectMapper = new ObjectMapper();

        HttpResponse<String> response = new StaticHttpResponse("""
            {
              "jobId": "job-456",
              "status": "COMPLETED",
              "document": {"entities": []}
            }
            """);

        JsonNode document = mapper.requireDocument(response);

        JsonNode metadata = document.path("runMetadata").path("metadata");
        assertTrue(metadata.path("sourceAccess").isMissingNode());
    }

    @Test
    void rejectsResponseWithoutDocumentPayload() {
        RemoteIndexerResponseMapper mapper = new RemoteIndexerResponseMapper();
        mapper.objectMapper = new ObjectMapper();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
            () -> mapper.requireDocument(new StaticHttpResponse("{\"status\":\"COMPLETED\"}")));

        assertTrue(ex.getMessage().contains("did not contain a document payload"));
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
