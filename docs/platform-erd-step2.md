# Platform ERD Summary (Step 2)

```text
workspace
  ├─< repository_registration
  │     ├─< index_run
  │     └─< snapshot
  │            └─< imported_fact
  ├─< overlay
  ├─< saved_view
  └─< audit_event

snapshot may optionally reference index_run
overlay may optionally reference snapshot
saved_view may optionally reference snapshot
audit_event may optionally reference repository_registration / index_run / snapshot
```

## Table intent summary

- `workspace` — top-level ownership boundary
- `repository_registration` — one source repository registration within a workspace
- `index_run` — requested/executing/completed indexing lifecycle
- `snapshot` — immutable imported result
- `imported_fact` — imported scope/entity/relationship/diagnostic projection
- `overlay` — user-authored interpretation layer
- `saved_view` — user-authored saved browse state
- `audit_event` — append-only trace of important actions
