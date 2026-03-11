package info.isaksson.erland.architecturebrowser.platform.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

@Path("/api/baseline")
@Produces(MediaType.APPLICATION_JSON)
public class BaselineResource {
    @GET
    public Map<String, Object> baseline() {
        return Map.of(
            "repository", "architecture-browser-platform",
            "step", "1",
            "summary", "Platform monorepo baseline",
            "apps", List.of("web", "api"),
            "libraries", List.of("contracts", "view-models"),
            "nextSteps", List.of(
                "Define core domain model and import contract",
                "Implement workspace and repository management APIs",
                "Implement index-run orchestration and status tracking"
            )
        );
    }
}
