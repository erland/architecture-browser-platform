package info.isaksson.erland.architecturebrowser.platform.api;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.contract.ContractValidationResult;
import info.isaksson.erland.architecturebrowser.platform.service.IndexerImportContractValidator;
import info.isaksson.erland.architecturebrowser.platform.service.StubImportResult;
import info.isaksson.erland.architecturebrowser.platform.service.StubImportService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/imports/indexer-ir")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ImportContractResource {
    @Inject
    IndexerImportContractValidator validator;

    @Inject
    StubImportService stubImportService;

    @POST
    @Path("/validate")
    public Response validate(JsonNode payload) {
        ContractValidationResult result = validator.validate(payload);
        return Response.status(result.valid() ? Response.Status.OK : Response.Status.BAD_REQUEST)
            .entity(result)
            .build();
    }

    @POST
    @Path("/stub-store")
    public Response stubStore(JsonNode payload) {
        ContractValidationResult result = validator.validate(payload);
        if (!result.valid()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(result)
                .build();
        }
        StubImportResult stored = stubImportService.importPayload(payload);
        return Response.status(Response.Status.CREATED)
            .entity(Map.of(
                "stored", true,
                "workspaceId", stored.workspaceId(),
                "repositoryRegistrationId", stored.repositoryRegistrationId(),
                "snapshotId", stored.snapshotId(),
                "counts", Map.of(
                    "scopes", stored.scopeCount(),
                    "entities", stored.entityCount(),
                    "relationships", stored.relationshipCount(),
                    "diagnostics", stored.diagnosticCount()
                )
            ))
            .build();
    }
}
