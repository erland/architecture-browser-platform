package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileImportArtifact;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFilePersistenceService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class SnapshotImportPersistenceService {
    @Inject
    JsonSupport jsonSupport;

    @Inject
    SnapshotImportOutcomeMapper outcomeMapper;

    @Inject
    SnapshotSourceFilePersistenceService snapshotSourceFilePersistenceService;

    public SnapshotImportPersistedResult persistSnapshot(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, IndexRunEntity run, ArchitectureIndexDocument document, JsonNode payload, SnapshotSourceFileImportArtifact snapshotSourceFiles) {
        Instant importedAt = Instant.now();
        CompletenessStatus completenessStatus = outcomeMapper.deriveCompletenessStatus(document);
        SnapshotStatus snapshotStatus = outcomeMapper.deriveSnapshotStatus(completenessStatus);
        RunOutcome derivedRunOutcome = outcomeMapper.deriveRunOutcome(document, completenessStatus);
        List<String> warnings = outcomeMapper.collectWarnings(document, completenessStatus);

        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = UUID.randomUUID().toString();
        snapshot.workspaceId = workspace.id;
        snapshot.repositoryRegistrationId = repository.id;
        snapshot.runId = run != null ? run.id : null;
        snapshot.snapshotKey = outcomeMapper.buildSnapshotKey(document, importedAt);
        snapshot.status = snapshotStatus;
        snapshot.completenessStatus = completenessStatus;
        snapshot.schemaVersion = document.schemaVersion();
        snapshot.indexerVersion = document.indexerVersion();
        snapshot.sourceRepositoryId = document.source().repositoryId();
        snapshot.sourceRevision = document.source().revision();
        snapshot.sourceBranch = document.source().branch();
        snapshot.importedAt = importedAt;
        snapshot.scopeCount = document.scopes().size();
        snapshot.entityCount = document.entities().size();
        snapshot.relationshipCount = document.relationships().size();
        snapshot.diagnosticCount = document.diagnostics().size();
        snapshot.indexedFileCount = document.completeness().indexedFileCount();
        snapshot.totalFileCount = document.completeness().totalFileCount();
        snapshot.degradedFileCount = document.completeness().degradedFileCount();
        snapshot.rawPayloadJson = jsonSupport.write(payload);
        snapshot.metadataJson = jsonSupport.write(document.metadata());
        snapshot.persist();
        int persistedSnapshotSourceFileCount = snapshotSourceFilePersistenceService.persistForSnapshot(snapshot, snapshotSourceFiles).size();

        return new SnapshotImportPersistedResult(snapshot, derivedRunOutcome, warnings, snapshotSourceFiles, persistedSnapshotSourceFileCount);
    }
}
