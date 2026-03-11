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
@Table(name = "workspace")
public class WorkspaceEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 120, nullable = false, unique = true)
    public String workspaceKey;

    @Column(length = 200, nullable = false)
    public String name;

    @Column(length = 2000)
    public String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public WorkspaceStatus status;

    @Column(nullable = false)
    public Instant createdAt;

    @Column(nullable = false)
    public Instant updatedAt;
}
