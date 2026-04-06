# Architecture Browser — Platform Plan for On-Demand Source Viewing

## Goal
Add a **read-only source viewer** to the **platform** component so that a user can select an object in the Browser and explicitly request to view the underlying source file with syntax highlighting.

This plan assumes:
- the source is fetched lazily from the indexer only when requested
- the platform does not store full source text in snapshot persistence
- the first version does not support clickable symbols inside the source viewer

## Starting state
The current platform already provides:
- imported snapshot payloads containing `sourceRefs`
- facts panel support that already lists source refs for the current selection
- backend integration with the indexer worker through `RemoteIndexerGateway` / `IndexerExecutionGateway`
- a Browser-first UI structure with facts panel, canvas, and selection state

Relevant current seams include:
- `libs/contracts/src/index.ts` for snapshot/source-ref contracts
- `apps/api/src/main/java/.../service/runs/RemoteIndexerGateway.java`
- `apps/web/src/components/browser-facts-panel/*`
- `apps/web/src/browser-snapshot/query/*`
- `apps/web/src/browser-session/*`

## Assumptions
1. The indexer run response will be extended to return source-access metadata such as a `sourceHandle`.
2. The platform snapshot persistence layer can store that source-access metadata with snapshot/run metadata.
3. Existing `sourceRefs` are sufficient to choose an initial file path and line range.
4. The first source-view interaction may focus on entities; support for scopes/relationships can reuse the same viewer later.
5. It is acceptable for source viewing to fail gracefully when the indexer-side retention window has expired.

## Scope
### In scope
- persist indexer source-access metadata from successful runs/imports
- add a backend API endpoint in the platform for source-view requests
- call the indexer’s new source-file endpoint from the platform backend
- add a read-only source viewer in the web app
- wire the viewer from the facts panel source refs of the selected object
- syntax highlighting, line numbers, and initial line-range focus
- tests for backend gateway logic and frontend viewer behavior

### Out of scope
- clickable source code
- bidirectional source-to-canvas navigation
- editing or saving source
- preloading source for the whole snapshot
- source diffing
- offline source viewing after indexer retention expiry

---

# Step 1 — Extend the platform snapshot/run model with source-access metadata

## Objective
Persist the source-view lookup information returned by the indexer so the platform can later fetch source files on demand.

## Deliverables
- Contract additions in the platform backend and frontend shared model.
- Snapshot/run persistence updates for new source-access metadata.
- Migration if persisted snapshot metadata schema changes.

## Recommended metadata
Persist a small additive structure such as:
- `sourceHandle`
- optional `sourceRevision`
- optional `sourceExpiresAt`
- optional `sourceAccessMode`

## Suggested touch points
- run response DTOs in `apps/api/.../api/dto`
- snapshot import/run lifecycle handling around:
  - `SnapshotImportRunLifecycleHandler`
  - `SnapshotImportResponseFactory`
  - run result persistence if source metadata belongs there
- frontend/shared contracts in `libs/contracts/src/index.ts`

## Why first
Without this, the platform has no durable key to request a file later.

## Verification
- Successful import/run persistence now includes the indexer-provided source-access metadata.
- Existing snapshot browsing still works unchanged.

---

# Step 2 — Decide where source-view requests belong in the platform API

## Objective
Add a backend API seam that the web app can call without talking directly to the indexer worker.

## Deliverables
- API design note describing the new platform endpoint.
- Resource/service placement decision.

## Recommended approach
Expose a platform-owned endpoint such as:
- `POST /api/browser/source/read`

The web app should call the platform API, and the platform backend should proxy to the indexer worker.

## Why this is better
- keeps worker URL and credentials hidden from the browser
- centralizes error handling and timeouts
- allows future authorization or auditing
- avoids coupling the web UI to indexer transport details

## Verification
- API design reviewed and mapped to a concrete resource/service pair.

---

# Step 3 — Add backend gateway support for source retrieval from the indexer

## Objective
Teach the platform backend how to call the indexer’s new source-file endpoint.

## Deliverables
- New gateway method for source retrieval.
- Request factory and error mapper for source-file calls.
- Tests for success and failure mapping.

## Suggested implementation seam
Extend the runs/indexer gateway area with focused collaborators, for example:
- add source-read method to `RemoteIndexerGateway`
- add `RemoteIndexerSourceRequestFactory`
- add `RemoteIndexerSourceErrorMapper`
- optionally add a dedicated `IndexerSourceGateway` if you want to keep run execution and source retrieval separate

## Suggested request payload from platform to indexer
- `sourceHandle`
- `path`
- optional `startLine`
- optional `endLine`

## Suggested response mapping back into platform
Return a platform DTO containing:
- `path`
- `language`
- `content`
- `lineCount`
- `requestedRange`
- `resolvedRange`
- `truncated`

## Verification
- Platform backend can successfully fetch file content from the indexer worker in tests.
- Worker validation failures are mapped to clear platform-side errors.

---

# Step 4 — Add a platform backend source-view endpoint

## Objective
Create the web-facing API that the Browser UI will call.

## Deliverables
- New API resource endpoint.
- Request/response DTOs.
- Service orchestration from snapshot context to remote indexer call.

## Suggested flow
1. Web sends snapshot context + chosen source ref.
2. Platform backend loads the snapshot metadata.
3. Platform backend finds the persisted `sourceHandle` for that snapshot/run.
4. Platform backend calls the indexer source endpoint.
5. Platform returns normalized source-view DTO to the web app.

## Important validation rules
The platform backend should:
- require a known snapshot id/key or equivalent current browser snapshot identity
- reject requests for snapshots with no source-access metadata
- require a relative path from a source ref
- optionally cap requested range or payload size

## Suggested placement
A new resource under browser/snapshot APIs is likely clearer than putting this into run-triggering APIs.

## Verification
- End-to-end platform API test proves a selected snapshot can request a file through the platform backend.

---

# Step 5 — Add a frontend source-view state model

## Objective
Represent source-view loading, success, and error states in the web app without polluting general browser selection state.

## Deliverables
- New source-view state model in the web app.
- Actions for open/load/success/error/close.
- Small controller seam for source-view orchestration.

## Recommended structure
Add a focused slice such as:
- `apps/web/src/browser-source-view/`

Suggested pieces:
- `model/` for state types
- `api/` for client calls
- `controller/` or hook for orchestration
- `presentation/` for view formatting utilities

## Suggested state fields
- `isOpen`
- `status` (`idle`, `loading`, `ready`, `error`)
- `path`
- `language`
- `content`
- `lineCount`
- `requestedRange`
- `resolvedRange`
- `errorMessage`
- current selection context metadata

## Why isolate it
This keeps source-view concerns from overloading the existing browser-session selection and canvas state.

## Verification
- Source-view state can be opened, loaded, reset, and closed independently of normal selection changes.

---

# Step 6 — Add “Show source” actions to the facts panel

## Objective
Let users request source from the existing Browser selection UI.

## Deliverables
- Facts panel actions or links on source refs.
- Logic to choose a default source ref when multiple refs exist.
- Tests for rendered actions.

## Recommended UX
For the first version:
- keep the current “Source refs” list
- add a button/link per source ref: **Show source**
- optionally add a primary action near the facts panel header: **Open primary source**

## Selection rule for primary source
Use a deterministic rule such as:
1. first source ref with a non-empty path
2. prefer one with `startLine`
3. preserve existing source-ref ordering from the snapshot payload

## Relevant files
Likely touch points:
- `apps/web/src/components/browser-facts-panel/BrowserFactsPanel.tsx`
- `BrowserFactsPanelSupportSections.tsx`
- `BrowserFactsPanel.utils.tsx`
- related presentation/model files if you want actions reflected in the facts-panel model rather than directly in the component

## Verification
- Facts panel shows source-open actions for source refs with valid paths.
- No action is shown for selections without source refs.

---

# Step 7 — Build a read-only source viewer component

## Objective
Display the fetched file in an easy-to-read syntax-highlighted viewer.

## Deliverables
- New reusable source-viewer component.
- Read-only rendering with line numbers.
- Highlighted initial range if provided.

## Recommended UX shape
Use one of these patterns:
- right-side drawer
- modal dialog
- replace-lower-panel region

Given your Browser layout, a right-side drawer or modal is likely easiest for the first release.

## Viewer behavior
- render file path prominently
- show syntax-highlighted content
- show line numbers
- scroll to the requested/resolved line range on open
- visually highlight the initial range
- allow close without affecting normal selection

## Technology choice
Use a read-only code viewer component rather than a full editing experience. The goal is viewing clarity, not editing.

## Verification
- Opening source displays the fetched content.
- Viewer scrolls to the referenced line when range metadata exists.
- Large files still render acceptably within chosen limits.

---

# Step 8 — Add frontend API client and controller wiring

## Objective
Connect the facts-panel action to the platform backend source-view endpoint.

## Deliverables
- Frontend API client call.
- Controller/hook for source open/load/close.
- Integration into the Browser view composition layer.

## Suggested placement
Hook the source-view controller into the BrowserView application layer so the facts panel can dispatch an open-source action without owning the fetch logic.

That likely means wiring through the BrowserView controller seam rather than directly issuing fetches from `BrowserFactsPanel`.

## Verification
- Clicking “Show source” triggers the load sequence and opens the viewer.
- Loading, error, and close states render correctly.

---

# Step 9 — Handle error states and retention expiry gracefully

## Objective
Make source-view failures understandable instead of confusing.

## Deliverables
- User-facing error states for:
  - source no longer available
  - no source access metadata for this snapshot
  - missing file
  - indexer worker unavailable
- Retry action where appropriate.

## Recommended messages
Prefer clear, bounded messages such as:
- “Source is no longer available for this snapshot.”
- “The indexer worker could not be reached.”
- “This source file could not be found in the retained indexed workspace.”

Avoid exposing filesystem internals.

## Verification
- Simulated expired-handle or missing-file responses surface a clear user message.

---

# Step 10 — Add backend and frontend tests

## Objective
Protect the new source-view flow with regression coverage.

## Deliverables
### Backend tests
- gateway success/failure mapping tests
- platform API resource tests for source read
- persistence tests for stored source-access metadata

### Frontend tests
- facts panel renders source-open actions
- clicking source-open triggers viewer load
- success path renders source viewer
- error path renders failure message
- close action hides the viewer

## Suggested relevant areas
- `apps/api/src/test/java/...`
- `apps/web/src/__tests__/...`
- existing Browser/facts-panel/controller tests are the best place to extend rather than creating isolated one-off test styles

## Verification
- standard backend and web test suites pass with the new feature enabled

---

# Step 11 — Document the user flow and operational dependency

## Objective
Make the feature understandable to developers and operators.

## Deliverables
- Platform doc covering source-view flow and its dependency on indexer-side retained source access.
- Notes on what happens when source retention expires.

## Key points to document
- platform stores source-access metadata, not full source text
- source is fetched lazily from the indexer worker
- source-view availability depends on indexer retention policy
- first version is read-only and non-clickable

## Verification
- A developer unfamiliar with the feature can run it locally from the docs.

---

# Suggested implementation sequence
1. Step 1 — persist source-access metadata
2. Step 2 — choose platform API seam
3. Step 3 — backend gateway support
4. Step 4 — backend source-view endpoint
5. Step 5 — frontend source-view state slice
6. Step 6 — facts panel actions
7. Step 7 — source viewer component
8. Step 8 — controller wiring
9. Step 9 — error handling
10. Step 10 — tests
11. Step 11 — documentation

---

# Verification commands
Use the normal platform verification gates after each completed slice.

## Web tests
```bash
cd platform
npm test -- --runInBand
```

## Web build
```bash
cd platform
npm run build
```

## API tests
```bash
cd platform/apps/api
mvn test
```

## Full platform package checks
```bash
cd platform/apps/api
mvn package
```

## Manual browser verification
After implementing the end-to-end path:
1. open a prepared snapshot in the Browser
2. select an entity with source refs
3. click **Show source**
4. confirm the viewer opens with syntax highlighting
5. confirm initial line focus matches the selected source ref

---

# Expected end state
After this plan is complete, the platform will:
- retain only lightweight source-access metadata per snapshot/run
- let the user explicitly request source for the current selection
- fetch source lazily from the indexer through the platform backend
- display the file in a read-only syntax-highlighted viewer with line focus
- avoid inflating snapshot storage with embedded full source text
- remain ready for a later Phase 2 that adds clickable source navigation
