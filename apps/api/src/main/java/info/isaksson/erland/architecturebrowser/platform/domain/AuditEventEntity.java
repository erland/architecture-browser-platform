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
@Table(name = "audit_event")
public class AuditEventEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String workspaceId;

    @Column(length = 64)
    public String repositoryRegistrationId;

    @Column(length = 64)
    public String runId;

    @Column(length = 64)
    public String snapshotId;

    @Column(length = 120, nullable = false)
    public String eventType;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public AuditActorType actorType;

    @Column(length = 200)
    public String actorId;

    @Column(nullable = false)
    public Instant happenedAt;

    @Column(columnDefinition = "clob")
    public String detailsJson;
}
