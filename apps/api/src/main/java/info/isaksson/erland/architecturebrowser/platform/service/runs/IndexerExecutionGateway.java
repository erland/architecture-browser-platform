package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class IndexerExecutionGateway {
    @ConfigProperty(name = "platform.indexer.mode", defaultValue = "stub")
    String mode;

    @Inject
    StubIndexerAdapter stubIndexerAdapter;

    @Inject
    RemoteIndexerGateway remoteIndexerGateway;

    public IndexRunEntity execute(WorkspaceEntity workspace,
                                  RepositoryRegistrationEntity repository,
                                  IndexRunEntity requestedRun,
                                  RequestRunRequest request) {
        if ("remote".equalsIgnoreCase(mode)) {
            return remoteIndexerGateway.execute(workspace, repository, requestedRun, request);
        }
        return stubIndexerAdapter.execute(requestedRun, request);
    }
}
