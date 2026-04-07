alter table snapshot_source_file drop constraint if exists fk_snapshot_source_file_snapshot;

alter table snapshot_source_file
    add constraint fk_snapshot_source_file_snapshot
    foreign key (snapshot_id) references snapshot(id)
    on delete cascade;
