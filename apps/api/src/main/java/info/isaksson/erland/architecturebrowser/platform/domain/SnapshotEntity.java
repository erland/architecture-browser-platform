package info.isaksson.erland.architecturebrowser.platform.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "snapshot")
public class SnapshotEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String workspaceId;

    @Column(length = 64, nullable = false)
    public String repositoryRegistrationId;

    @Column(length = 64)
    public String runId;

    @Column(length = 120, nullable = false)
    public String snapshotKey;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public SnapshotStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public CompletenessStatus completenessStatus;

    @Column(length = 64, nullable = false)
    public String schemaVersion;

    @Column(length = 64, nullable = false)
    public String indexerVersion;

    @Column(length = 200)
    public String sourceRepositoryId;

    @Column(length = 255)
    public String sourceRevision;

    @Column(length = 255)
    public String sourceBranch;

    @Column(nullable = false)
    public Instant importedAt;

    @Column(nullable = false)
    public int scopeCount;

    @Column(nullable = false)
    public int entityCount;

    @Column(nullable = false)
    public int relationshipCount;

    @Column(nullable = false)
    public int diagnosticCount;

    @Column(nullable = false)
    public int indexedFileCount;

    @Column(nullable = false)
    public int totalFileCount;

    @Column(nullable = false)
    public int degradedFileCount;

    @Column(columnDefinition = "clob")
    public String rawPayloadJson;

    @Column(columnDefinition = "clob")
    public String metadataJson;
}
