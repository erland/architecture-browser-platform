package info.isaksson.erland.architecturebrowser.platform.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "saved_view")
public class SavedViewEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String workspaceId;

    @Column(length = 64)
    public String snapshotId;

    @Column(length = 200, nullable = false)
    public String name;

    @Column(length = 120, nullable = false)
    public String viewType;

    @Column(columnDefinition = "text")
    public String queryJson;

    @Column(columnDefinition = "text")
    public String layoutJson;

    @Column(nullable = false)
    public Instant createdAt;

    @Column(nullable = false)
    public Instant updatedAt;
}
