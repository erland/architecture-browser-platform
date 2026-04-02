package info.isaksson.erland.architecturebrowser.platform.service.runs;

import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RemoteIndexerErrorMapperTest {
    @Test
    void mapsHttpFailuresWithAbbreviatedBody() {
        RemoteIndexerErrorMapper mapper = new RemoteIndexerErrorMapper();
        IllegalStateException ex = mapper.mapHttpFailure(502, "gateway down");
        assertEquals("Indexer worker returned HTTP 502: gateway down", ex.getMessage());
    }

    @Test
    void mapsIoFailuresWithRootCauseDetails() {
        RemoteIndexerErrorMapper mapper = new RemoteIndexerErrorMapper();
        IOException ioException = new IOException("outer", new RuntimeException("socket closed"));

        IllegalStateException ex = mapper.mapIoFailure("https://indexer.test/api/index-jobs/run", ioException);

        assertTrue(ex.getMessage().contains("Failed to communicate with the indexer worker"));
        assertTrue(ex.getMessage().contains("socket closed"));
        assertInstanceOf(IOException.class, ex.getCause());
    }
}
