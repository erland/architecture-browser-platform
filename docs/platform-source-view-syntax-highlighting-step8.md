# Platform Step 8 — Syntax-highlighting integration based on returned language

This step upgrades the embedded read-only source viewer so it renders language-aware token styling instead of plain unformatted code lines.

## What was added

- Language-aware token rendering inside `BrowserSourceViewDialog`
- Lightweight built-in highlighter with no extra frontend dependency
- Token categories for:
  - keywords
  - strings
  - numbers
  - comments
  - tags
  - attributes / properties
  - punctuation
- Specialized handling for:
  - `json`
  - `xml`
  - `jsx`
  - `tsx`
  - `yaml`
  - `properties`
- Fallback highlighting for general code-like languages such as:
  - `java`
  - `javascript`
  - `typescript`
  - `sql`

## Why this approach

The step keeps the viewer:

- read-only
- in-app
- lightweight
- aligned with the `language` returned by the platform/indexer contract

It avoids introducing a larger editor dependency before the first source-view flow is proven stable.

## Current limitations

This is intentionally not a full parser-grade highlighter. It is designed to improve readability for architecture browsing, not to match IDE-level tokenization.

Known limitations:

- no AST-aware highlighting
- no multi-line comment/string state tracking across lines
- JSX/TSX highlighting is tag-oriented rather than full JavaScript/TypeScript expression parsing
- markdown/plaintext remain mostly unstyled

## Expected user-visible result

When the source viewer opens, the file is still read-only, but token colors now follow the returned language so common constructs are easier to scan quickly.
