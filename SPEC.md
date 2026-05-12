# AI Memory Format Versioning — and PMF v0.2

**Status:** Draft v0.1 of the versioning rules; PMF v0.2 of the format.
**License:** MIT
**Reference implementation:** [`src/`](./src/) in this repo

This document is two specs in one:

1. **Versioning rules** — vendor-neutral rules for how any AI memory format should declare versions, define forward/backward compat, and ship migrations.
2. **PMF v0.2** — the worked example: the next version of [Plan 5's Portable Memory Format](https://github.com/Accuoa/context-portability/blob/main/SPEC.md), with three new fields demonstrating the migration patterns the rules describe.

---

## Part 1: Versioning rules

These rules apply to any AI memory format. We use PMF as the worked example in this repo, but the rules are vendor-neutral.

### 1. Version field discipline

- Format versions are `MAJOR.MINOR` (no patch — spec versions evolve in coarse steps).
- **MINOR bumps are additive only:** new optional fields, new computed/derived fields, new vocabulary in existing enums. Consumer code written against v0.N continues to validate v0.N+1 docs, provided it ignores unknown fields.
- **MAJOR bumps are for breaking changes:** a previously-optional field becomes required, a field type changes, semantic meaning of an existing field changes. v0.x consumers MUST NOT be expected to accept v1.x docs.

### 2. Forward compatibility (consumers)

- Consumers MUST ignore fields they don't recognize.
- Consumers MUST check the `version` field before relying on any non-baseline feature.
- Consumers SHOULD log unknown fields they see, to help producers debug version mismatches.

### 3. Backward compatibility (producers)

- Producers SHOULD emit the highest version they fully populate.
- A producer declaring `version: "0.2"` MUST NOT use any v0.1 feature in a different way than v0.1 specified (no overloading).
- If a producer needs to emit data that would only be readable by v0.2 consumers, it MUST declare v0.2.

### 4. Provenance

- Any doc that was migrated (rather than natively produced at the current version) MUST declare `provenance`.
- `provenance.migrated_from` is the original version the doc was authored at.
- `provenance.migrated_at` is the ISO-8601 timestamp of migration.
- `provenance.migrator` identifies the tool that performed the migration (versioned), e.g. `"format-survives-upgrades@0.1.0"`.
- Consumers MAY use `provenance` to apply defensive checks (e.g., "this doc was migrated by an unknown tool — flag for human review").
- Producers writing a doc natively at the current version MAY omit `provenance`. Absence of `provenance` MUST NOT be interpreted as "this doc is suspect".

### 5. Migration declaration

- Anyone publishing v0.N+1 of a format SHOULD ship a v0.N → v0.N+1 migration tool (or equivalent declarative spec).
- Migrations SHOULD be pure: same input + same migrator version → byte-identical output (modulo `provenance.migrated_at`, which is timestamped).
- Migrations SHOULD preserve semantic content; they MAY add fields with reasonable defaults but MUST NOT invent data that wasn't present or derivable.
- Migrations MUST validate input against the source-version schema before applying, and MUST validate output against the target-version schema before returning.
- Downgrade migrations (v0.N → v0.N-1) are OPTIONAL and MAY be lossy. If a downgrade is published, it SHOULD document what data is dropped.

### 6. Stable id stability

If a format defines content-derived stable ids (PMF does: `sha256(text + sorted-metadata)`), the id-derivation rule MUST be specified in a way that's robust to additive migrations.

Specifically: empty arrays, null fields, and undefined fields MUST be stripped from metadata before hashing. This way, a migration that adds an empty-default array field (like `tags: []`) does not change ids.

For PMF, this rule applies retroactively to v0.1 (no breaking change, since v0.1 docs have no array/empty fields in metadata).

---

## Part 2: PMF v0.2

The worked example of the rules above.

### Schema

```jsonc
{
  "format": "portable-memory-format", // exact literal
  "version": "0.2", // exact literal in v0.2
  "source": {
    "vendor": "openai", // unchanged from v0.1
    "exported_at": "2026-05-01T00:00:00Z", // optional ISO-8601
  },
  "provenance": {
    // present iff doc was migrated; producers MAY omit
    "migrated_from": "0.1",
    "migrated_at": "2026-05-12T12:00:00.000Z",
    "migrator": "format-survives-upgrades@0.1.0",
  },
  "memories": [
    {
      "id": "abc123def456", // 12-char stable id (sha256, see §6)
      "text": "I prefer dark mode.",
      "metadata": {
        "category": "preference", // v0.1 field, unchanged
        "source_id": "mem-1", // v0.1 field, unchanged
        "created_at": "2024-10-27T00:00:00Z", // v0.1 field, unchanged
        "tags": ["preference", "ui"], // NEW in v0.2: additive, default []
        "expires_at": "2030-01-01T00:00:00Z", // NEW in v0.2: additive, optional
      },
    },
  ],
}
```

### What changed from v0.1

| Field        | Path                              | Change                                           |
| ------------ | --------------------------------- | ------------------------------------------------ |
| `tags`       | `memories[*].metadata.tags`       | Added. Optional. Default `[]`. Array of strings. |
| `expires_at` | `memories[*].metadata.expires_at` | Added. Optional. ISO-8601 string.                |
| `provenance` | top level                         | Added. Optional. Present iff doc was migrated.   |

All three are additive — this is a MINOR bump per §1.

### Backward compat narrative

v0.1's `metadata` schema uses `.catchall(z.unknown())`, which means v0.1 already accepts `tags` and `expires_at` as untyped extra fields. v0.2 _promotes_ them from catchall to typed schema with defaults. A v0.1 doc that already had `metadata.tags` set via catchall has that value preserved through migration, not overwritten.

This means **v0.1 docs that happened to use `tags` informally were already forward-compatible with v0.2**. The migration just adds Zod-level typing and a default.

### Migration patterns demonstrated

| Pattern                                     | Field                 | Behavior in migration                                                                            |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| Additive into metadata with empty default   | `metadata.tags`       | New entries get `[]`. §6 stability rule strips empty arrays pre-hash so stable ids don't change. |
| Additive into metadata with null default    | `metadata.expires_at` | Migration omits the field; preserved if already present via v0.1 catchall.                       |
| Computed at document level during migration | `provenance`          | Populated by the engine post-step, not the step itself. Records what migrated the doc.           |

### Reference implementation

This repo contains:

- Zod schemas for v0.1 and v0.2 ([`src/schema/`](./src/schema/))
- The v0.1 → v0.2 migration step ([`src/migrations/v0.1-to-v0.2.mjs`](./src/migrations/v0.1-to-v0.2.mjs))
- Engine that resolves migration paths and populates provenance ([`src/engine.mjs`](./src/engine.mjs))
- CLI ([`src/cli.mjs`](./src/cli.mjs)) wiring it all together
- 30-sample benchmark verifying the rules hold

### Contributing

Want to propose v0.3? Open an issue with the additive field set. Want to propose a different versioning convention (e.g., calendar-based)? Open an issue tagged `versioning-rules` — the rules in Part 1 are also living.
