# API subtree

This directory owns web-side transport and cached backend access responsibilities.

- `httpClient.ts` — low-level HTTP transport helpers and `HttpError`
- `platformApi.ts` — platform backend request helpers
- `snapshot-cache/` — layered snapshot cache contract, storage implementations, and runtime composition
- `snapshot-cache/` — compatibility facade that re-exports `snapshot-cache/`
- `index.ts` — subtree barrel export
