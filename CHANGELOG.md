# CHANGELOG

This changelog is anchored on the **format version** (PMF), not the package version. The CLI/tooling is `format-survives-upgrades@<pkg-version>` separately.

## PMF v0.2 — 2026-05-12

Additive minor release. v0.1 docs forward-compatible (v0.1's catchall already accepted these fields untyped); v0.2 consumers MUST NOT require these fields.

### Added

- `memories[*].metadata.tags` — array of strings. Default `[]`. Typed; was previously available as untyped catchall.
- `memories[*].metadata.expires_at` — ISO-8601 string. Optional. Typed; was previously available as untyped catchall.
- Top-level `provenance` — `{ migrated_from, migrated_at, migrator }`. Present iff doc was migrated. Optional for natively-produced v0.2 docs.

### Spec rule additions

- **§6 stable-id stability:** empty arrays, null fields, and undefined fields MUST be stripped from metadata before hashing for stable-id derivation. No-op for v0.1 (no array fields in metadata in v0.1) — applies forward.

### Migration

- v0.1 → v0.2: see [`src/migrations/v0.1-to-v0.2.mjs`](./src/migrations/v0.1-to-v0.2.mjs).
- v0.2 → v0.1: NOT provided. Downgrade is out of scope in this release.

### Backward compat

- v0.1 consumers ignoring unknown fields will accept v0.2 docs (per §2 forward-compat rule).
- v0.1 producers continue to be valid.

## PMF v0.1 — 2026-05-07

Initial release. See [context-portability](https://github.com/Accuoa/context-portability) for the v0.1 spec and reference implementation.
