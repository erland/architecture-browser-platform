## Wave C — Step C2 notes

This step refactors `BrowserFactsPanel.model.ts` by splitting the facts-panel model building logic into focused builders.

Added modules:
- `apps/web/src/components/BrowserFactsPanel.model.entity.ts`
- `apps/web/src/components/BrowserFactsPanel.model.scope.ts`
- `apps/web/src/components/BrowserFactsPanel.model.relationship.ts`
- `apps/web/src/components/BrowserFactsPanel.model.shared.ts`

Resulting ownership:
- **entity**: builds the entity-mode facts panel model from `getEntityFacts(...)`
- **scope**: builds the scope-mode model and owns scope-bridge derivation
- **relationship**: builds the relationship-mode model and relationship metadata usage
- **shared**: owns shared summary/formatting helpers and viewpoint explanation shaping

Compatibility:
- `BrowserFactsPanel.model.ts` remains the public entry point and still exports `buildBrowserFactsPanelModel(...)`.

Behavioral intent:
- no deliberate runtime behavior changes
- clearer separation between entity/scope/relationship model assembly and shared formatting policies
