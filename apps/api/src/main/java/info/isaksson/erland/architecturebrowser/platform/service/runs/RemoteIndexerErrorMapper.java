package info.isaksson.erland.architecturebrowser.platform.service.runs;

import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;

@ApplicationScoped
public class RemoteIndexerErrorMapper {
    public IllegalStateException mapHttpFailure(int statusCode, String responseBody) {
        return new IllegalStateException(
            "Indexer worker returned HTTP " + statusCode + ": "
                + RemoteIndexerGatewaySupport.abbreviate(responseBody, 1000)
        );
    }

    public IllegalStateException mapIoFailure(String endpoint, IOException exception) {
        return new IllegalStateException(
            "Failed to communicate with the indexer worker at " + endpoint + ". "
                + RemoteIndexerGatewaySupport.rootCauseDetails(exception),
            exception
        );
    }

    public IllegalStateException mapInterruptedFailure(String endpoint, InterruptedException exception) {
        Thread.currentThread().interrupt();
        return new IllegalStateException(
            "Interrupted while waiting for the indexer worker response from " + endpoint + ". "
                + RemoteIndexerGatewaySupport.rootCauseDetails(exception),
            exception
        );
    }
}
