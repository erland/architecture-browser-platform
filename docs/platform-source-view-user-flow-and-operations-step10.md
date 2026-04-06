# Platform source view — user flow and operational behavior (Step 10)

## Purpose

This document describes how the Platform source-view feature behaves from the user perspective and what operational assumptions it makes about the Indexer contract introduced in the paired indexer work.

This step is documentation-only. It does not change the runtime behavior implemented in Steps 1–9.

## Feature summary

The Browser can open a read-only source viewer for the currently selected object when that object has a resolvable source reference and the originating indexing run exposed retained-source access metadata.

Supported selected object types:

- Scope
- Entity
- Relationship
- Diagnostic

The source viewer currently supports:

- in-app read-only viewing
- line numbers
- initial line-range focus
- loading and error states
- lightweight syntax highlighting based on the returned source language

The source viewer does **not** currently support:

- editing source
- clickable source navigation
- source-to-source jumping
- background refresh of expired handles

## End-user flow

### 1. User selects an object in the Browser

The user selects a scope, entity, relationship, or diagnostic in the Browser experience.

### 2. Platform determines whether source can be offered

The Browser UI shows **View source** only when the current selection has at least one usable source reference.

At this stage, the UI is only checking whether source references exist on the selected object. It is not yet proving that the retained source is still available in the indexer.

### 3. User clicks **View source**

The frontend submits a selected-object source-view request to the platform backend.

The request identifies:

- workspace
- snapshot
- selected object type
- selected object id
- optional source-ref index override
- optional line-range override

### 4. Platform resolves the source request

The platform backend:

1. loads the referenced snapshot
2. parses the stored snapshot payload
3. locates the selected scope/entity/relationship/diagnostic
4. chooses a usable source reference
5. loads the run that produced the snapshot
6. extracts `metadata.sourceAccess.sourceHandle` from persisted run metadata
7. builds the concrete source-read request for the indexer worker

The request sent to the indexer is based on:

- `sourceHandle`
- repository-relative source `path`
- optional `startLine`
- optional `endLine`

### 5. Platform proxies the request to the indexer

The platform calls the indexer worker endpoint:

- `POST /api/source-files/read`

### 6. Platform returns source content to the Browser UI

The platform forwards a normalized source-view response containing:

- source path
- source language
- total line count
- file size
- requested line range
- full source text

### 7. Browser opens the embedded source viewer

The Browser opens the in-app source viewer dialog and renders:

- file path and metadata
- syntax-highlighted source text
- line numbers
- focused/highlighted line range

## Selected-object resolution behavior

### Source reference selection rules

When a selected object has multiple source references, the platform resolves one reference for the first-version user flow.

The default behavior is:

1. use the explicitly requested `sourceRefIndex` when provided
2. otherwise use the first readable source reference available on the selected object
3. for diagnostics, fall back to `filePath` when explicit `sourceRefs` are absent

### Line range behavior

If the selected source reference includes line numbers, those are used as the initial viewer focus.

If the caller provides explicit line overrides, the explicit values take precedence.

If no line range is available, the viewer opens at the top of the file.

## Error behavior and user-visible outcomes

The source-view flow is intentionally explicit about failure states.

### Validation errors

Examples:

- missing request body
- unsupported selected object type
- missing snapshot id for selected-object requests
- invalid `sourceRefIndex`
- selected object not found in snapshot payload

User-visible result:

- the platform returns a validation-style error
- the Browser shows an in-app error state

### Upstream indexer errors

Examples:

- missing or expired `sourceHandle`
- retained source root no longer available
- referenced file missing
- path rejected by indexer safety rules
- indexer worker unavailable

User-visible result:

- the platform returns an upstream/bad-gateway style error
- the Browser shows an in-app error state instead of opening stale content

### Expired retention

This is the most important expected operational failure.

A user can browse a snapshot successfully even after the retained source backing that snapshot has expired in the indexer.

In that case:

- architecture browsing still works
- the **View source** action can still be shown if source references exist
- opening source fails once the platform tries to resolve through the expired `sourceHandle`

User-visible result:

- source open fails
- the Browser shows an error state
- the user should re-index the source tree if fresh source viewing is required

## Operational assumptions

The platform-side implementation assumes the following about the indexer contract.

### 1. Source access is handed off in the run response

The indexer worker run endpoint returns source-access metadata as `sourceAccess`, including at minimum a durable `sourceHandle`.

The platform persists this into run metadata so later source-view requests can resolve back to the same retained source context.

### 2. Source reads are lazy and on-demand

The platform does not store full source text in snapshots or in run metadata.

Instead, source is requested only when the user explicitly asks to view it.

### 3. The indexer owns retained-source safety

The platform assumes the indexer enforces:

- repository-relative path resolution
- traversal rejection
- binary-file rejection
- retained-root containment
- file-size limits
- expiry/retention validation

The platform should not duplicate those low-level file-safety rules.

### 4. Source paths come from indexed source references

The platform should use repository-relative paths derived from snapshot/source-ref data rather than constructing arbitrary file paths.

### 5. Retention is finite

The platform assumes source handles can expire and that source viewing is therefore a best-effort companion feature, not a permanent guarantee for every historical snapshot.

## Backward-compatibility expectations

The implemented source-view flow is designed to be backward compatible with older runs and snapshots.

### Older runs without `sourceAccess`

If a run predates the source-view work and has no persisted `metadata.sourceAccess.sourceHandle`, then selected-object resolution cannot build a concrete source-read request.

Expected behavior:

- architecture browsing still works
- source viewing fails for that snapshot/run combination

### Objects without source references

If a selected object has no usable source reference, the Browser should not offer **View source**.

### Direct request shape support

The platform endpoint still supports the direct request shape from earlier steps:

- `sourceHandle`
- `path`
- optional line range

This helps preserve compatibility with internal callers/tests while the Browser uses the higher-level selected-object flow.

## Current UX limitations

The current source-view UX is intentionally narrow.

Known limitations:

- source text is loaded as a whole file, not streamed
- syntax highlighting is lightweight, not parser-perfect
- source is not clickable
- there is no symbol outline or jump-to-declaration support
- there is no explicit “re-index to restore source access” action in the dialog
- the viewer does not currently pre-check whether the source handle is still valid before the user clicks

## Recommended support guidance

When source view fails in environments where the Browser otherwise works normally, the most likely causes are:

1. the snapshot was created before source-access persistence existed
2. the source handle has expired in the indexer
3. the indexer worker is unavailable
4. the referenced file is no longer retrievable under the retained source root

Recommended operator guidance:

- confirm the snapshot’s producing run contains `metadata.sourceAccess`
- confirm the indexer worker is reachable from the platform backend
- confirm retained-source cleanup did not prune the handle already
- re-index the source tree when fresh source access is needed

## Future evolution

Possible follow-on improvements after Step 10:

- more user-friendly expired-handle messaging with re-index guidance
- preflight validation so the UI can hide or soften **View source** when source access is known to be unavailable
- richer syntax highlighting
- multiple source-ref chooser UI
- source outline / symbol navigation
- clickable source-to-source navigation backed by indexed targets

## Related documents

- `docs/platform_source_view_plan.md`
- `docs/platform-source-access-persistence-step1.md`
- `docs/platform-source-view-proxy-step2.md`
- `docs/platform-source-view-endpoint-step3.md`
- `docs/platform-source-view-selection-resolution-step4.md`
- `docs/platform-source-view-frontend-action-step5.md`
- `docs/platform-source-viewer-step6.md`
- `docs/platform-source-viewer-focus-and-state-step7.md`
- `docs/platform-source-view-syntax-highlighting-step8.md`
- `docs/platform-source-view-tests-step9.md`
