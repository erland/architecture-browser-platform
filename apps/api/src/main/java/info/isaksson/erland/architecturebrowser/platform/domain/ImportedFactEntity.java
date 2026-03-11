package info.isaksson.erland.architecturebrowser.platform.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "imported_fact")
public class ImportedFactEntity extends PanacheEntityBase {
    @Id
    @Column(length = 96, nullable = false)
    public String id;

    @Column(length = 64, nullable = false)
    public String snapshotId;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    public FactType factType;

    @Column(length = 255, nullable = false)
    public String externalId;

    @Column(length = 64, nullable = false)
    public String factKind;

    @Column(length = 255, nullable = false)
    public String name;

    @Column(length = 512)
    public String displayName;

    @Column(length = 255)
    public String scopeExternalId;

    @Column(length = 255)
    public String fromExternalId;

    @Column(length = 255)
    public String toExternalId;

    @Column(length = 4000)
    public String summary;

    @Column(columnDefinition = "clob")
    public String payloadJson;
}
