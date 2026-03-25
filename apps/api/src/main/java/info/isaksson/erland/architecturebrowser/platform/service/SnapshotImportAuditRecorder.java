package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;

@ApplicationScoped
public class SnapshotImportAuditRecorder {
    @Inject
    AuditService auditService;

    @Inject
    JsonSupport jsonSupport;

    public void recordImported(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, IndexRunEntity run, SnapshotEntity snapshot, ArchitectureIndexDocument document, RunOutcome derivedRunOutcome) {
        auditService.recordSnapshotEvent(
            workspace.id,
            repository.id,
            run != null ? run.id : null,
            snapshot.id,
            "snapshot.imported",
            jsonSupport.write(Map.of(
                "snapshotKey", snapshot.snapshotKey,
                "status", snapshot.status.name(),
                "completenessStatus", snapshot.completenessStatus.name(),
                "derivedRunOutcome", derivedRunOutcome.name(),
                "counts", Map.of(
                    "scopes", document.scopes().size(),
                    "entities", document.entities().size(),
                    "relationships", document.relationships().size(),
                    "diagnostics", document.diagnostics().size()
                )
            ))
        );
    }
}
