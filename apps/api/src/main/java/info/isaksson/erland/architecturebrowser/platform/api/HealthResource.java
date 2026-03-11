package info.isaksson.erland.architecturebrowser.platform.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.util.Map;

@Path("/api/health")
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {
    @GET
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "service", "architecture-browser-platform-api",
            "version", "0.1.0",
            "time", Instant.now().toString()
        );
    }
}
