package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositorySourceType;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Map;

@ApplicationScoped
public class RemoteIndexerRequestFactory {
    @Inject
    JsonSupport jsonSupport;

    public String buildRequestBody(RepositoryRegistrationEntity repository, String runId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("jobId", runId);
        payload.put("repositoryId", repository.repositoryKey != null ? repository.repositoryKey : repository.id);
        if (repository.sourceType == RepositorySourceType.LOCAL_PATH) {
            payload.put("sourcePath", RemoteIndexerGatewaySupport.normalizeNullable(repository.localPath));
        } else {
            payload.put("gitUrl", RemoteIndexerGatewaySupport.normalizeNullable(repository.remoteUrl));
            payload.put("gitRef", RemoteIndexerGatewaySupport.normalizeNullable(repository.defaultBranch));
        }
        return jsonSupport.write(payload);
    }
}
