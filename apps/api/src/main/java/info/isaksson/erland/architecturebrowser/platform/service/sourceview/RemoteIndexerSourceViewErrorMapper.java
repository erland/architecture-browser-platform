package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import info.isaksson.erland.architecturebrowser.platform.service.sourceview.RemoteIndexerSourceViewSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;

@ApplicationScoped
public class RemoteIndexerSourceViewErrorMapper {
    public IllegalStateException mapHttpFailure(int statusCode, String responseBody) {
        return new IllegalStateException(
            "Indexer source view request returned HTTP " + statusCode + ": "
                + RemoteIndexerSourceViewSupport.abbreviate(responseBody, 1000)
        );
    }

    public IllegalStateException mapIoFailure(String endpoint, IOException exception) {
        return new IllegalStateException(
            "Failed to communicate with the indexer source view endpoint at " + endpoint + ": "
                + RemoteIndexerSourceViewSupport.rootCauseDetails(exception),
            exception
        );
    }

    public IllegalStateException mapInterruptedFailure(String endpoint, InterruptedException exception) {
        Thread.currentThread().interrupt();
        return new IllegalStateException(
            "Interrupted while communicating with the indexer source view endpoint at " + endpoint + ": "
                + RemoteIndexerSourceViewSupport.rootCauseDetails(exception),
            exception
        );
    }
}
