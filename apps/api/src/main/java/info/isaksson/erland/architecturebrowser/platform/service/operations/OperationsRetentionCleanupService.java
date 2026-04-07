package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.domain.*;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class OperationsRetentionCleanupService {
    void applySnapshotDeletes(List<SnapshotEntity> snapshotsToDelete) {
        for (SnapshotEntity snapshot : snapshotsToDelete) {
            ImportedFactEntity.delete("snapshotId", snapshot.id);
            SavedCanvasEntity.delete("snapshotId", snapshot.id);
            AuditEventEntity.delete("snapshotId", snapshot.id);
            SnapshotSourceFileEntity.delete("snapshotId", snapshot.id);
            snapshot.delete();
        }
    }

    void applyRunDeletes(List<IndexRunEntity> runsToDelete) {
        for (IndexRunEntity run : runsToDelete) {
            AuditEventEntity.delete("runId", run.id);
            run.delete();
        }
    }
}
