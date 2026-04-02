package info.isaksson.erland.architecturebrowser.platform.service.runs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositorySourceType;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class RemoteIndexerRequestFactoryTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildsGitRequestPayload() throws Exception {
        RemoteIndexerRequestFactory factory = new RemoteIndexerRequestFactory();
        factory.jsonSupport = newJsonSupport();

        RepositoryRegistrationEntity repository = new RepositoryRegistrationEntity();
        repository.id = "repo-1";
        repository.repositoryKey = "platform-web";
        repository.sourceType = RepositorySourceType.GIT;
        repository.remoteUrl = " https://example.com/repo.git ";
        repository.defaultBranch = " main ";

        String json = factory.buildRequestBody(repository, "run-1");
        JsonNode payload = objectMapper.readTree(json);

        assertEquals("run-1", payload.path("jobId").asText());
        assertEquals("platform-web", payload.path("repositoryId").asText());
        assertEquals("https://example.com/repo.git", payload.path("gitUrl").asText());
        assertEquals("main", payload.path("gitRef").asText());
        assertFalse(payload.has("sourcePath"));
    }

    @Test
    void buildsLocalPathRequestPayload() throws Exception {
        RemoteIndexerRequestFactory factory = new RemoteIndexerRequestFactory();
        factory.jsonSupport = newJsonSupport();

        RepositoryRegistrationEntity repository = new RepositoryRegistrationEntity();
        repository.id = "repo-2";
        repository.repositoryKey = null;
        repository.sourceType = RepositorySourceType.LOCAL_PATH;
        repository.localPath = "  /tmp/project  ";

        String json = factory.buildRequestBody(repository, "run-2");
        JsonNode payload = objectMapper.readTree(json);

        assertEquals("run-2", payload.path("jobId").asText());
        assertEquals("repo-2", payload.path("repositoryId").asText());
        assertEquals("/tmp/project", payload.path("sourcePath").asText());
        assertNull(payload.get("gitUrl"));
        assertNull(payload.get("gitRef"));
    }
    private JsonSupport newJsonSupport() throws Exception {
        JsonSupport jsonSupport = new JsonSupport();
        var field = JsonSupport.class.getDeclaredField("objectMapper");
        field.setAccessible(true);
        field.set(jsonSupport, objectMapper);
        return jsonSupport;
    }

}
