# Repository structure decision

## Recommendation

Keep the platform backend and frontend in the same `architecture-browser-platform` repository for the MVP.

## Why this is a good fit right now

- The platform is one product and one installation story.
- The backend API, web UI, database migrations, deployment packaging, and import contract will evolve together in the early steps.
- A single repository makes it easier to run local end-to-end slices with one Compose file and one documentation set.
- The separation that matters most right now is between the platform product and the deterministic indexer engine.

## When a split might become worthwhile later

Consider splitting backend and frontend only if one or more of these become true:

- different teams own them independently
- release cadence diverges sharply
- deployment lifecycles become independent
- the web app becomes reusable across multiple backend products
- CI time and repository size become painful

## Current recommendation summary

- keep `architecture-browser-platform` as one monorepo for the platform product
- keep `architecture-browser-indexer` separate as its own repository
