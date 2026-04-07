package info.isaksson.erland.architecturebrowser.platform.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "snapshot_source_file",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_snapshot_source_file_path", columnNames = {"snapshotId", "relativePath"})
    }
)
public class SnapshotSourceFileEntity extends PanacheEntityBase {
    @Id
    @Column(length = 160, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String snapshotId;

    @Column(length = 2048, nullable = false)
    public String relativePath;

    @Column(length = 64)
    public String language;

    @Column(length = 120)
    public String contentType;

    @Column(nullable = false)
    public long sizeBytes;

    @Column(nullable = false)
    public int totalLineCount;

    @Column(columnDefinition = "text", nullable = false)
    public String textContent;
}
