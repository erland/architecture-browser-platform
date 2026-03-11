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
@Table(name = "index_run")
public class IndexRunEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String workspaceId;

    @Column(length = 64, nullable = false)
    public String repositoryRegistrationId;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public TriggerType triggerType;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public RunStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    public RunOutcome outcome;

    @Column(nullable = false)
    public Instant requestedAt;

    public Instant startedAt;

    public Instant completedAt;

    @Column(length = 64)
    public String schemaVersion;

    @Column(length = 64)
    public String indexerVersion;

    @Column(length = 4000)
    public String errorSummary;

    @Column(columnDefinition = "clob")
    public String metadataJson;
}
