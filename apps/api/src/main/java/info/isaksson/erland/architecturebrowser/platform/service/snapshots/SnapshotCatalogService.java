package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.DiagnosticSummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.NameCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SourceInfo;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
public class SnapshotCatalogService {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    public List<SnapshotSummaryResponse> listByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        List<SnapshotEntity> snapshots = SnapshotEntity.list("workspaceId = ?1 order by importedAt desc", workspaceId);
        return mapSummaries(snapshots);
    }

    public List<SnapshotSummaryResponse> listByRepository(String workspaceId, String repositoryId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        repositoryManagementService.requireRepository(workspaceId, repositoryId);
        List<SnapshotEntity> snapshots = SnapshotEntity.list(
            "workspaceId = ?1 and repositoryRegistrationId = ?2 order by importedAt desc",
            workspaceId,
            repositoryId
        );
        return mapSummaries(snapshots);
    }

    public SnapshotDetailResponse getDetail(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        ArchitectureIndexDocument document = parseDocument(snapshot.rawPayloadJson);
        return new SnapshotDetailResponse(
            toSummary(snapshot),
            toSourceInfo(document),
            toRunInfo(document),
            collectWarnings(document)
        );
    }

    public SnapshotOverviewResponse getOverview(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        ArchitectureIndexDocument document = parseDocument(snapshot.rawPayloadJson);
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshot.id);

        return new SnapshotOverviewResponse(
            toSummary(snapshot),
            toSourceInfo(document),
            toRunInfo(document),
            toCompletenessInfo(document),
            summarizeKinds(facts, FactType.SCOPE),
            summarizeKinds(facts, FactType.ENTITY),
            summarizeKinds(facts, FactType.RELATIONSHIP),
            summarizeKinds(facts, FactType.DIAGNOSTIC),
            buildTopScopes(document, facts),
            buildRecentDiagnostics(document),
            collectWarnings(document)
        );
    }

    private List<SnapshotSummaryResponse> mapSummaries(List<SnapshotEntity> snapshots) {
        return snapshots.stream().map(this::toSummary).toList();
    }

    private SnapshotSummaryResponse toSummary(SnapshotEntity snapshot) {
        RepositoryRegistrationEntity repository = RepositoryRegistrationEntity.findById(snapshot.repositoryRegistrationId);
        return new SnapshotSummaryResponse(
            snapshot.id,
            snapshot.workspaceId,
            snapshot.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            snapshot.runId,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus,
            deriveRunOutcome(snapshot),
            snapshot.schemaVersion,
            snapshot.indexerVersion,
            snapshot.sourceRevision,
            snapshot.sourceBranch,
            snapshot.importedAt,
            snapshot.scopeCount,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount,
            snapshot.indexedFileCount,
            snapshot.totalFileCount,
            snapshot.degradedFileCount
        );
    }

    private RunOutcome deriveRunOutcome(SnapshotEntity snapshot) {
        return switch (snapshot.completenessStatus) {
            case COMPLETE -> RunOutcome.SUCCESS;
            case PARTIAL -> RunOutcome.PARTIAL;
            case FAILED -> RunOutcome.FAILED;
        };
    }

    private SnapshotEntity requireSnapshot(String workspaceId, String snapshotId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        if (snapshot == null || !workspaceId.equals(snapshot.workspaceId)) {
            throw new NotFoundException("Snapshot not found: " + snapshotId);
        }
        return snapshot;
    }

    private ArchitectureIndexDocument parseDocument(String rawPayloadJson) {
        try {
            JsonNode payload = jsonSupport.readTree(rawPayloadJson);
            return objectMapper.convertValue(payload, ArchitectureIndexDocument.class);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Stored snapshot payload could not be parsed.", ex);
        }
    }

    private SourceInfo toSourceInfo(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.RepositorySource source = document.source();
        return new SourceInfo(
            source.repositoryId(),
            source.acquisitionType(),
            source.path(),
            source.remoteUrl(),
            source.branch(),
            source.revision(),
            source.acquiredAt()
        );
    }

    private RunInfo toRunInfo(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.RunMetadata runMetadata = document.runMetadata();
        if (runMetadata == null) {
            return new RunInfo(null, null, null, List.of());
        }
        return new RunInfo(
            runMetadata.startedAt(),
            runMetadata.completedAt(),
            runMetadata.outcome(),
            Optional.ofNullable(runMetadata.detectedTechnologies()).orElse(List.of())
        );
    }

    private CompletenessInfo toCompletenessInfo(ArchitectureIndexDocument document) {
        ArchitectureIndexDocument.CompletenessMetadata completeness = document.completeness();
        return new CompletenessInfo(
            completeness.status(),
            completeness.indexedFileCount(),
            completeness.totalFileCount(),
            completeness.degradedFileCount(),
            Optional.ofNullable(completeness.omittedPaths()).orElse(List.of()),
            Optional.ofNullable(completeness.notes()).orElse(List.of())
        );
    }

    private List<KindCount> summarizeKinds(List<ImportedFactEntity> facts, FactType factType) {
        Map<String, Long> counts = facts.stream()
            .filter(fact -> fact.factType == factType)
            .collect(Collectors.groupingBy(fact -> safeKey(fact.factKind), Collectors.counting()));
        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .map(entry -> new KindCount(entry.getKey(), entry.getValue()))
            .toList();
    }

    private List<NameCount> buildTopScopes(ArchitectureIndexDocument document, List<ImportedFactEntity> facts) {
        Map<String, String> scopeNames = new LinkedHashMap<>();
        for (ArchitectureIndexDocument.LogicalScope scope : Optional.ofNullable(document.scopes()).orElse(List.of())) {
            scopeNames.put(scope.id(), firstNonBlank(scope.displayName(), scope.name(), scope.id()));
        }

        Map<String, Long> counts = new LinkedHashMap<>();
        for (ImportedFactEntity fact : facts) {
            String scopeId = fact.factType == FactType.SCOPE ? fact.externalId : fact.scopeExternalId;
            if (scopeId == null || scopeId.isBlank()) {
                continue;
            }
            counts.merge(scopeId, 1L, Long::sum);
        }

        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .limit(8)
            .map(entry -> new NameCount(entry.getKey(), scopeNames.getOrDefault(entry.getKey(), entry.getKey()), entry.getValue()))
            .toList();
    }

    private List<DiagnosticSummary> buildRecentDiagnostics(ArchitectureIndexDocument document) {
        List<DiagnosticSummary> results = new ArrayList<>();
        for (ArchitectureIndexDocument.Diagnostic diagnostic : Optional.ofNullable(document.diagnostics()).orElse(List.of())) {
            results.add(new DiagnosticSummary(
                diagnostic.id(),
                diagnostic.code(),
                diagnostic.severity(),
                diagnostic.message(),
                diagnostic.filePath(),
                diagnostic.entityId(),
                diagnostic.scopeId()
            ));
        }
        return results.stream()
            .sorted(Comparator.comparing(DiagnosticSummary::severity, Comparator.nullsLast(String::compareTo))
                .thenComparing(DiagnosticSummary::code, Comparator.nullsLast(String::compareTo)))
            .limit(12)
            .toList();
    }

    private List<String> collectWarnings(ArchitectureIndexDocument document) {
        List<String> warnings = new ArrayList<>();
        if (document.completeness() != null && "PARTIAL".equalsIgnoreCase(document.completeness().status())) {
            warnings.add("Snapshot is partial: browse data is available, but some files were omitted or degraded during indexing.");
        }
        if (document.completeness() != null && document.completeness().notes() != null) {
            warnings.addAll(document.completeness().notes());
        }
        return List.copyOf(warnings);
    }

    private String safeKey(String value) {
        return value == null || value.isBlank() ? "unknown" : value.trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "unknown";
    }
}
