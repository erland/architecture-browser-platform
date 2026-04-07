create table snapshot_source_file (
    id varchar(160) primary key,
    snapshot_id varchar(64) not null,
    relative_path varchar(2048) not null,
    language varchar(64),
    content_type varchar(120),
    size_bytes bigint not null,
    total_line_count integer not null,
    text_content text not null,
    constraint fk_snapshot_source_file_snapshot foreign key (snapshot_id) references snapshot(id),
    constraint uq_snapshot_source_file_path unique (snapshot_id, relative_path)
);

create index idx_snapshot_source_file_snapshot on snapshot_source_file(snapshot_id);
create index idx_snapshot_source_file_snapshot_path on snapshot_source_file(snapshot_id, relative_path);
