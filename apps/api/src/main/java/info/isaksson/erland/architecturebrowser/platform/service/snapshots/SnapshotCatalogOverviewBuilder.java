package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.DiagnosticSummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.NameCount;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
class SnapshotCatalogOverviewBuilder {
    List<KindCount> summarizeKinds(List<ImportedFactEntity> facts, FactType factType) {
        Map<String, Long> counts = facts.stream()
            .filter(fact -> fact.factType == factType)
            .collect(Collectors.groupingBy(fact -> safeKey(fact.factKind), Collectors.counting()));
        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .map(entry -> new KindCount(entry.getKey(), entry.getValue()))
            .toList();
    }

    List<NameCount> buildTopScopes(ArchitectureIndexDocument document, List<ImportedFactEntity> facts) {
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

    List<DiagnosticSummary> buildRecentDiagnostics(ArchitectureIndexDocument document) {
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

    List<String> collectWarnings(ArchitectureIndexDocument document) {
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
