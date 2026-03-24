create table saved_canvas (
    id varchar(64) primary key,
    workspace_id varchar(64) not null,
    snapshot_id varchar(64),
    name varchar(200) not null,
    document_json text not null,
    document_version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_saved_canvas_workspace foreign key (workspace_id) references workspace(id),
    constraint fk_saved_canvas_snapshot foreign key (snapshot_id) references snapshot(id)
);

create index idx_saved_canvas_workspace on saved_canvas(workspace_id);
create index idx_saved_canvas_snapshot on saved_canvas(snapshot_id);
create index idx_saved_canvas_workspace_snapshot on saved_canvas(workspace_id, snapshot_id);
