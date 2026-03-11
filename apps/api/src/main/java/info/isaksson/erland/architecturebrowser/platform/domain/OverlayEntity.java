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
@Table(name = "overlay")
public class OverlayEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String workspaceId;

    @Column(length = 64)
    public String snapshotId;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public OverlayKind kind;

    @Column(length = 200, nullable = false)
    public String name;

    @Column(columnDefinition = "clob", nullable = false)
    public String definitionJson;

    @Column(nullable = false)
    public Instant createdAt;

    @Column(nullable = false)
    public Instant updatedAt;
}
