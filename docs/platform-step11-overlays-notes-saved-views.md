# Step 11 — Overlays, notes, and saved views

This step adds user-defined customization state that is stored separately from imported snapshot facts.

## Backend

Added snapshot customization endpoints for:
- listing overlays and saved views
- creating, updating, and deleting overlays
- creating, updating, duplicating, and deleting saved views

Overlay definitions are stored as JSON in the existing `overlay` table and can contain:
- target entity ids
- target scope ids
- free-text note
- arbitrary attributes

Saved views are stored in the existing `saved_view` table and persist:
- query/filter state
- layout/focus state
- view type and display name

Audit events are emitted for overlay and saved-view changes.

## Frontend

Added a Step 11 panel on the snapshot page with:
- overlay/note creation from current focused entity/scope context
- overlay inspection and deletion
- saved-view creation from current snapshot browser filters
- saved-view reopen, duplicate, and delete actions

## Verification intent

- overlays are stored separately from imported facts
- saved views can restore snapshot browser state
- overlay/saved-view operations produce audit events
