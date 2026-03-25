package info.isaksson.erland.architecturebrowser.platform.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

@Path("/api/domain-model")
@Produces(MediaType.APPLICATION_JSON)
public class DomainModelResource {
    @GET
    public Map<String, Object> domainModel() {
        return Map.of(
            "aggregateRoots", List.of(
                "workspace",
                "repository_registration",
                "index_run",
                "snapshot",
                "audit_event"
            ),
            "importProjection", List.of(
                "imported_fact"
            ),
            "notes", List.of(
                "Imported indexer data is immutable once attached to a snapshot.",
                "Step 2 intentionally stores snapshot facts in a generic projection table before later view-specific schemas are introduced."
            )
        );
    }
}
