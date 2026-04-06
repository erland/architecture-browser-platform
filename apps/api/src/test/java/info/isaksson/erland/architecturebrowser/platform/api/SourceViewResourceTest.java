package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSourceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSourceResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.PlatformSourceViewProxyService;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewReadRequest;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewReadResponse;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewSelectionRequest;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewSelectionResolverService;
import jakarta.ws.rs.WebApplicationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SourceViewResourceTest {
    @Test
    void delegatesToProxyServiceAndReturnsApiResponse() {
        SourceViewResource resource = new SourceViewResource();
        resource.sourceViewProxyService = new RecordingSourceViewProxyService(
            new SourceViewReadResponse("src_123", "src/App.tsx", "tsx", 120, 4096L, 10, 20, "export const app = true;")
        );
        resource.sourceViewSelectionResolverService = new ThrowingSelectionResolverService(new IllegalStateException("should not resolve selection"));

        ReadSourceResponse response = resource.readSource("workspace-1", new ReadSourceRequest("src_123", "src/App.tsx", 10, 20, null, null, null, null));

        assertEquals("src_123", response.sourceHandle());
        assertEquals("src/App.tsx", response.path());
        assertEquals("tsx", response.language());
        assertEquals(120, response.totalLineCount());
        assertEquals(4096L, response.fileSizeBytes());
        assertEquals(10, response.requestedStartLine());
        assertEquals(20, response.requestedEndLine());
        assertEquals("export const app = true;", response.sourceText());
        RecordingSourceViewProxyService proxy = (RecordingSourceViewProxyService) resource.sourceViewProxyService;
        assertEquals("src_123", proxy.lastRequest.sourceHandle());
        assertEquals("src/App.tsx", proxy.lastRequest.path());
        assertEquals(10, proxy.lastRequest.startLine());
        assertEquals(20, proxy.lastRequest.endLine());
    }


    @Test
    void resolvesSelectedObjectIntoSourceRequestBeforeProxying() {
        SourceViewResource resource = new SourceViewResource();
        resource.sourceViewProxyService = new RecordingSourceViewProxyService(
            new SourceViewReadResponse("src_resolved", "src/domain/Order.java", "java", 90, 2048L, 12, 24, "class Order {}")
        );
        resource.sourceViewSelectionResolverService = new RecordingSelectionResolverService(
            new SourceViewReadRequest("src_resolved", "src/domain/Order.java", 12, 24)
        );

        ReadSourceResponse response = resource.readSource("workspace-1", new ReadSourceRequest(null, null, null, null,
            "snapshot-1", "ENTITY", "entity-1", null));

        assertEquals("src_resolved", response.sourceHandle());
        RecordingSelectionResolverService resolver = (RecordingSelectionResolverService) resource.sourceViewSelectionResolverService;
        assertEquals("snapshot-1", resolver.lastRequest.snapshotId());
        assertEquals("ENTITY", resolver.lastRequest.selectedObjectType());
        assertEquals("entity-1", resolver.lastRequest.selectedObjectId());
        RecordingSourceViewProxyService proxy = (RecordingSourceViewProxyService) resource.sourceViewProxyService;
        assertEquals("src_resolved", proxy.lastRequest.sourceHandle());
        assertEquals("src/domain/Order.java", proxy.lastRequest.path());
    }


    @Test
    void mapsSelectionResolutionFailuresToValidationError() {
        SourceViewResource resource = new SourceViewResource();
        resource.sourceViewProxyService = new ThrowingSourceViewProxyService(new IllegalStateException("should not call proxy"));
        resource.sourceViewSelectionResolverService = new ThrowingSelectionResolverService(
            new IllegalArgumentException("Requested sourceRefIndex is out of range for the selected object.")
        );

        ValidationException exception = assertThrows(ValidationException.class,
            () -> resource.readSource("workspace-1", new ReadSourceRequest(null, null, null, null,
                "snapshot-1", "ENTITY", "entity-1", 9)));

        assertEquals("Requested sourceRefIndex is out of range for the selected object.", exception.errors().getFirst());
    }

    @Test
    void rejectsMissingRequestBody() {
        SourceViewResource resource = new SourceViewResource();
        resource.sourceViewProxyService = new RecordingSourceViewProxyService(null);
        resource.sourceViewSelectionResolverService = new ThrowingSelectionResolverService(new IllegalStateException("should not resolve selection"));

        ValidationException exception = assertThrows(ValidationException.class,
            () -> resource.readSource("workspace-1", null));

        assertEquals("Source view request body is required.", exception.errors().getFirst());
    }

    @Test
    void mapsBadRequestFromProxyToValidationError() {
        SourceViewResource resource = new SourceViewResource();
        resource.sourceViewProxyService = new ThrowingSourceViewProxyService(new IllegalArgumentException("Source view request field 'path' is required."));
        resource.sourceViewSelectionResolverService = new ThrowingSelectionResolverService(new IllegalStateException("should not resolve selection"));

        ValidationException exception = assertThrows(ValidationException.class,
            () -> resource.readSource("workspace-1", new ReadSourceRequest("src_123", " ", null, null, null, null, null, null)));

        assertEquals("Source view request field 'path' is required.", exception.errors().getFirst());
    }

    @Test
    void mapsUpstreamFailuresToBadGateway() {
        SourceViewResource resource = new SourceViewResource();
        resource.sourceViewProxyService = new ThrowingSourceViewProxyService(new IllegalStateException("Indexer source view request returned HTTP 410: handle expired"));
        resource.sourceViewSelectionResolverService = new ThrowingSelectionResolverService(new IllegalStateException("should not resolve selection"));

        WebApplicationException exception = assertThrows(WebApplicationException.class,
            () -> resource.readSource("workspace-1", new ReadSourceRequest("src_123", "src/App.tsx", null, null, null, null, null, null)));

        assertEquals(502, exception.getResponse().getStatus());
    }

    private static final class RecordingSourceViewProxyService extends PlatformSourceViewProxyService {
        private final SourceViewReadResponse response;
        private SourceViewReadRequest lastRequest;

        private RecordingSourceViewProxyService(SourceViewReadResponse response) {
            this.response = response;
        }

        @Override
        public SourceViewReadResponse readSourceFile(SourceViewReadRequest request) {
            this.lastRequest = request;
            return response;
        }
    }

    private static final class ThrowingSourceViewProxyService extends PlatformSourceViewProxyService {
        private final RuntimeException exception;

        private ThrowingSourceViewProxyService(RuntimeException exception) {
            this.exception = exception;
        }

        @Override
        public SourceViewReadResponse readSourceFile(SourceViewReadRequest request) {
            throw exception;
        }
    }

    private static final class RecordingSelectionResolverService extends SourceViewSelectionResolverService {
        private final SourceViewReadRequest resolvedRequest;
        private SourceViewSelectionRequest lastRequest;

        private RecordingSelectionResolverService(SourceViewReadRequest resolvedRequest) {
            this.resolvedRequest = resolvedRequest;
        }

        @Override
        public SourceViewReadRequest resolve(String workspaceId, SourceViewSelectionRequest request) {
            this.lastRequest = request;
            return resolvedRequest;
        }
    }

    private static final class ThrowingSelectionResolverService extends SourceViewSelectionResolverService {
        private final RuntimeException exception;

        private ThrowingSelectionResolverService(RuntimeException exception) {
            this.exception = exception;
        }

        @Override
        public SourceViewReadRequest resolve(String workspaceId, SourceViewSelectionRequest request) {
            throw exception;
        }
    }
}
