package info.isaksson.erland.architecturebrowser.platform.service.operations;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.DiagnosticRow;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.FailedSnapshotRow;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class OperationsOverviewSnapshotAttentionBuilder {
    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    List<FailedSnapshotRow> buildFailedSnapshots(List<OperationsOverviewAttentionQueryService.FailedSnapshotProjection> failedSnapshotProjections) {
        return failedSnapshotProjections.stream()
            .map(this::toFailedSnapshot)
            .toList();
    }

    private FailedSnapshotRow toFailedSnapshot(OperationsOverviewAttentionQueryService.FailedSnapshotProjection snapshot) {
        ArchitectureIndexDocument document = parseDocument(snapshot.rawPayloadJson);
        List<DiagnosticRow> diagnostics = Optional.ofNullable(document.diagnostics()).orElse(List.of()).stream()
            .map(diagnostic -> new DiagnosticRow(
                diagnostic.id(),
                diagnostic.severity(),
                diagnostic.phase(),
                diagnostic.code(),
                diagnostic.message(),
                diagnostic.fatal(),
                diagnostic.filePath(),
                diagnostic.entityId(),
                diagnostic.scopeId()
            ))
            .limit(8)
            .toList();

        List<String> warnings = new ArrayList<>();
        if (document.completeness() != null && document.completeness().notes() != null) {
            warnings.addAll(document.completeness().notes());
        }
        if (snapshot.status == SnapshotStatus.FAILED) {
            warnings.add(0, "Snapshot import produced a failed completeness state.");
        } else if (snapshot.completenessStatus != CompletenessStatus.COMPLETE) {
            warnings.add(0, "Snapshot import is partial; browse data may omit degraded files or scopes.");
        }
        return new FailedSnapshotRow(
            snapshot.id,
            snapshot.repositoryRegistrationId,
            snapshot.repositoryKey,
            snapshot.repositoryName,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus.name(),
            snapshot.importedAt,
            snapshot.diagnosticCount,
            diagnostics,
            List.copyOf(warnings)
        );
    }

    private ArchitectureIndexDocument parseDocument(String rawPayloadJson) {
        if (rawPayloadJson == null || rawPayloadJson.isBlank()) {
            return new ArchitectureIndexDocument(
                null,
                null,
                null,
                null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                null,
                null
            );
        }
        try {
            return objectMapper.convertValue(jsonSupport.readTree(rawPayloadJson), ArchitectureIndexDocument.class);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Stored snapshot payload could not be parsed.", ex);
        }
    }
}
