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
@Table(name = "repository_registration")
public class RepositoryRegistrationEntity extends PanacheEntityBase {
    @Id
    @Column(length = 64, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String workspaceId;

    @Column(length = 120, nullable = false)
    public String repositoryKey;

    @Column(length = 200, nullable = false)
    public String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public RepositorySourceType sourceType;

    @Column(length = 2048)
    public String localPath;

    @Column(length = 2048)
    public String remoteUrl;

    @Column(length = 255)
    public String defaultBranch;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public RepositoryStatus status;

    @Column(columnDefinition = "text")
    public String metadataJson;

    @Column(nullable = false)
    public Instant createdAt;

    @Column(nullable = false)
    public Instant updatedAt;
}
