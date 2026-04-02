# API subtree

This directory owns web-side transport and cached backend access responsibilities.

- `httpClient.ts` — low-level HTTP transport helpers and `HttpError`
- `platformApi.ts` — platform backend request helpers
- `snapshotCache.ts` — IndexedDB-backed snapshot cache
- `index.ts` — subtree barrel export
