package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.contract.IndexerImportContract;
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
            "platformImportVersion", IndexerImportContract.PLATFORM_IMPORT_VERSION,
            "supportedSchemaVersions", IndexerImportContract.SUPPORTED_SCHEMA_VERSIONS,
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
            "stubImportEndpoint", "/api/imports/indexer-ir/stub-store",
            "notes", List.of(
                "This contract matches the currently observed indexer MVP payload shape.",
                "Platform domain rows remain separate from imported immutable facts.",
                "Step 2 stores imported facts in a generic snapshot plus imported_fact table for future vertical slices."
            )
        );
    }
}
