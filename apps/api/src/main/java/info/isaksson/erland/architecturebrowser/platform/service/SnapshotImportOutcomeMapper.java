package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class SnapshotImportOutcomeMapper {
    public CompletenessStatus deriveCompletenessStatus(ArchitectureIndexDocument document) {
        return CompletenessStatus.valueOf(document.completeness().status());
    }

    public SnapshotStatus deriveSnapshotStatus(CompletenessStatus completenessStatus) {
        return completenessStatus == CompletenessStatus.FAILED ? SnapshotStatus.FAILED : SnapshotStatus.READY;
    }

    public RunOutcome deriveRunOutcome(ArchitectureIndexDocument document, CompletenessStatus completenessStatus) {
        String runOutcome = document.runMetadata() != null ? document.runMetadata().outcome() : null;
        if (runOutcome != null && !runOutcome.isBlank()) {
            return RunOutcome.valueOf(runOutcome.trim().toUpperCase(Locale.ROOT));
        }
        return switch (completenessStatus) {
            case COMPLETE -> RunOutcome.SUCCESS;
            case PARTIAL -> RunOutcome.PARTIAL;
            case FAILED -> RunOutcome.FAILED;
        };
    }

    public List<String> collectWarnings(ArchitectureIndexDocument document, CompletenessStatus completenessStatus) {
        List<String> warnings = new ArrayList<>();
        if (completenessStatus == CompletenessStatus.PARTIAL) {
            warnings.add("Partial import accepted: browse data is available, but omitted/degraded files were reported by the indexer.");
        }
        if (document.completeness().notes() != null) {
            warnings.addAll(document.completeness().notes());
        }
        return List.copyOf(warnings);
    }

    public String buildSnapshotKey(ArchitectureIndexDocument document, Instant importedAt) {
        String revision = document.source().revision();
        if (revision != null && !revision.isBlank()) {
            return revision.trim() + "-" + importedAt.toEpochMilli();
        }
        String completedAt = document.runMetadata() != null ? document.runMetadata().completedAt() : null;
        if (completedAt != null && !completedAt.isBlank()) {
            return completedAt.replace(':', '-');
        }
        return "import-" + importedAt.toEpochMilli();
    }
}
