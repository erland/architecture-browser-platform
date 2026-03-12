create table workspace (
    id varchar(64) primary key,
    workspace_key varchar(120) not null unique,
    name varchar(200) not null,
    description varchar(2000),
    status varchar(32) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table repository_registration (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    repository_key varchar(120) not null,
    name varchar(200) not null,
    source_type varchar(32) not null,
    local_path varchar(2048),
    remote_url varchar(2048),
    default_branch varchar(255),
    status varchar(32) not null,
    metadata_json text,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_repository_workspace foreign key (workspace_id) references workspace(id),
    constraint uq_repository_per_workspace unique (workspace_id, repository_key)
);

create table index_run (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    repository_registration_id varchar(64) not null,
    trigger_type varchar(32) not null,
    status varchar(32) not null,
    outcome varchar(32),
    requested_at timestamp with time zone not null,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    schema_version varchar(64),
    indexer_version varchar(64),
    error_summary varchar(4000),
    metadata_json text,
    constraint fk_index_run_workspace foreign key (workspace_id) references workspace(id),
    constraint fk_index_run_repository foreign key (repository_registration_id) references repository_registration(id)
);

create table snapshot (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    repository_registration_id varchar(64) not null,
    run_id varchar(64),
    snapshot_key varchar(120) not null,
    status varchar(32) not null,
    completeness_status varchar(32) not null,
    schema_version varchar(64) not null,
    indexer_version varchar(64) not null,
    source_repository_id varchar(200),
    source_revision varchar(255),
    source_branch varchar(255),
    imported_at timestamp with time zone not null,
    scope_count integer not null,
    entity_count integer not null,
    relationship_count integer not null,
    diagnostic_count integer not null,
    indexed_file_count integer not null,
    total_file_count integer not null,
    degraded_file_count integer not null,
    raw_payload_json text,
    metadata_json text,
    constraint fk_snapshot_workspace foreign key (workspace_id) references workspace(id),
    constraint fk_snapshot_repository foreign key (repository_registration_id) references repository_registration(id),
    constraint fk_snapshot_run foreign key (run_id) references index_run(id),
    constraint uq_snapshot_key unique (repository_registration_id, snapshot_key)
);

create table imported_fact (
    id varchar(96) primary key,
    snapshot_id varchar(64) not null,
    fact_type varchar(32) not null,
    external_id varchar(255) not null,
    fact_kind varchar(64) not null,
    name varchar(255) not null,
    display_name varchar(512),
    scope_external_id varchar(255),
    from_external_id varchar(255),
    to_external_id varchar(255),
    summary varchar(4000),
    payload_json text,
    constraint fk_imported_fact_snapshot foreign key (snapshot_id) references snapshot(id)
);
create index ix_imported_fact_snapshot_type on imported_fact(snapshot_id, fact_type);
create index ix_imported_fact_snapshot_external on imported_fact(snapshot_id, external_id);

create table overlay (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    snapshot_id varchar(64),
    kind varchar(32) not null,
    name varchar(200) not null,
    definition_json text not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_overlay_workspace foreign key (workspace_id) references workspace(id),
    constraint fk_overlay_snapshot foreign key (snapshot_id) references snapshot(id)
);

create table saved_view (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    snapshot_id varchar(64),
    name varchar(200) not null,
    view_type varchar(120) not null,
    query_json text,
    layout_json text,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_saved_view_workspace foreign key (workspace_id) references workspace(id),
    constraint fk_saved_view_snapshot foreign key (snapshot_id) references snapshot(id)
);

create table audit_event (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    repository_registration_id varchar(64),
    run_id varchar(64),
    snapshot_id varchar(64),
    event_type varchar(120) not null,
    actor_type varchar(32) not null,
    actor_id varchar(200),
    happened_at timestamp with time zone not null,
    details_json text,
    constraint fk_audit_workspace foreign key (workspace_id) references workspace(id),
    constraint fk_audit_repository foreign key (repository_registration_id) references repository_registration(id),
    constraint fk_audit_run foreign key (run_id) references index_run(id),
    constraint fk_audit_snapshot foreign key (snapshot_id) references snapshot(id)
);
create index ix_audit_workspace_time on audit_event(workspace_id, happened_at);
