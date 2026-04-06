package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import info.isaksson.erland.architecturebrowser.platform.service.sourceview.RemoteIndexerSourceViewSupport;
import info.isaksson.erland.architecturebrowser.platform.service.runs.RemoteIndexerTransport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.http.HttpResponse;

@ApplicationScoped
public class PlatformSourceViewProxyService {
    @ConfigProperty(name = "platform.indexer.base-url")
    String baseUrl;

    @ConfigProperty(name = "platform.indexer.connect-timeout-seconds", defaultValue = "10")
    long connectTimeoutSeconds;

    @ConfigProperty(name = "platform.indexer.read-timeout-seconds", defaultValue = "300")
    long readTimeoutSeconds;

    @Inject
    RemoteIndexerTransport transport;

    @Inject
    RemoteIndexerSourceViewRequestFactory requestFactory;

    @Inject
    RemoteIndexerSourceViewResponseMapper responseMapper;

    @Inject
    RemoteIndexerSourceViewErrorMapper errorMapper;

    public SourceViewReadResponse readSourceFile(SourceViewReadRequest request) {
        String endpoint = RemoteIndexerSourceViewSupport.trimTrailingSlash(baseUrl) + "/api/source-files/read";
        String requestJson = requestFactory.buildRequestBody(request);
        try {
            HttpResponse<String> response = transport.postJson(endpoint, requestJson, connectTimeoutSeconds, readTimeoutSeconds);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw errorMapper.mapHttpFailure(response.statusCode(), response.body());
            }
            return responseMapper.map(response);
        } catch (IOException e) {
            throw errorMapper.mapIoFailure(endpoint, e);
        } catch (InterruptedException e) {
            throw errorMapper.mapInterruptedFailure(endpoint, e);
        }
    }
}
