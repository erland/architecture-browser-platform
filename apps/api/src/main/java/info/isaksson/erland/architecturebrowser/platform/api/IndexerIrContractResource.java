package info.isaksson.erland.architecturebrowser.platform.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

@Path("/api/contracts/indexer-ir")
@Produces(MediaType.APPLICATION_JSON)
public class IndexerIrContractResource {
    @GET
    public Map<String, Object> currentContract() {
        return Map.of(
            "schemaVersion", "1.0.0",
            "topLevelFields", List.of(
                "schemaVersion",
                "indexerVersion",
                "runMetadata",
                "source",
                "scopes",
                "entities",
                "relationships",
                "diagnostics",
                "completeness",
                "metadata"
            ),
            "notes", List.of(
                "Current understanding is derived from the MVP-level architecture-browser-indexer source code and fixture payloads.",
                "The platform will treat imported facts as immutable snapshot input.",
                "User overlays and annotations will be stored separately in later steps."
            )
        );
    }
}
