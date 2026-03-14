# Browser local top search

Search is now part of the local Browser workspace and follows the entity-first interaction model.

## Current behavior

Search reads from the Browser session's local snapshot index.
The user can search within:

- **Current scope**
- **Entire snapshot**

## Activation model

Search now distinguishes **navigation targets** from **analysis targets**.

### Scope hit

- clicking the result navigates/selects the scope
- using **Add** adds that scope's **primary entities** to the canvas

### Entity hit

- clicking the result adds/focuses the entity for analysis

### Relationship hit

- clicking the result focuses the relationship in the analysis workspace

### Diagnostic hit

- clicking the result continues to route into the broader analysis flow

## Why this matters

This keeps search aligned with the rest of the Browser:

- tree = navigate scopes
- search scope click = navigate scopes
- search scope add = start entity analysis
- canvas = analyze entities and relationships
