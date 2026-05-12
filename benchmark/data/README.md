# Benchmark dataset

30 hand-built PMF v0.1 docs with expected v0.2 migration outcomes.

## Files

- `samples.jsonl` — one v0.1 PMF doc per line (the input to `runMigration`)
- `expected.jsonl` — paired expected outcome per line. Either `{ "memories_count": N, "first_text": "...", "first_metadata_tags": [...], "has_provenance": true, "provenance_migrated_from": "0.1" }` for happy/edge-path samples, or `{ "expected_error": "<regex>" }` for malformed samples.

## Composition

- **15 happy-path** (lines 1–15): realistic v0.1 docs — single entry, multiple entries, unicode text, mixed metadata (with/without `source_id`, `created_at`), `source.exported_at` present and absent, varying memory counts.
- **10 edge-case** (lines 16–25): empty memories array, 50-entry doc, very long text (3KB+), unicode emoji-heavy text, entry with embedded JSON-like text in content, metadata with extra catchall fields (e.g., `tags` already present in v0.1), metadata with `expires_at` already present in v0.1, single-character text, all-numeric text, metadata with multiple catchall fields.
- **5 malformed** (lines 26–30): wrong `format` literal, wrong `version` literal (e.g., `"0.0"`), invalid JSON, missing `memories` field, `memories` not an array.

## License

MIT.
