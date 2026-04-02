package info.isaksson.erland.architecturebrowser.platform.service.runs;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@ApplicationScoped
public class RemoteIndexerTransport {
    @Inject
    RemoteIndexerHttpClient httpClient;

    public HttpResponse<String> postJson(String endpoint,
                                         String requestJson,
                                         long connectTimeoutSeconds,
                                         long readTimeoutSeconds) throws IOException, InterruptedException {
        HttpClient client = httpClient.create(connectTimeoutSeconds);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .timeout(Duration.ofSeconds(readTimeoutSeconds))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestJson))
            .build();
        return httpClient.send(client, request);
    }
}
