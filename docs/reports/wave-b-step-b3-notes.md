## Wave B — Step B3 notes

This step refactors `browserCanvasPlacement.ts` by separating placement-policy values from placement algorithms.

Changes made:
- added `apps/web/src/browserCanvasPlacement.policy.ts`
- moved spacing and collision constants into the new policy module
- moved the reusable `roundToGrid()` helper into the policy module
- updated `apps/web/src/browserCanvasPlacement.ts` to import those values instead of defining them inline

Behavioral intent:
- no runtime behavior change
- keep all existing placement algorithms and exported APIs intact
- clarify the boundary between policy/configuration and algorithmic placement logic
