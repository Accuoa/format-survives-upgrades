# Architecture

## Big picture

```
                    ┌────────────────────────────┐
                    │ user runs:                 │
                    │ format-survives-upgrades   │
                    │   migrate                  │
                    │   --in v0.1.json           │
                    │   --out v0.2.json          │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
              ┌──────────────────────────────────────┐
              │   CLI (src/cli.mjs)                  │
              │                                      │
              │   ┌──────────────────────────────┐   │
              │   │  Engine (src/engine.mjs)     │   │
              │   │                              │   │
              │   │  1. validate input vs v0.1   │   │
              │   │  2. resolve path via reg.    │   │
              │   │  3. apply migration step(s)  │   │
              │   │  4. populate provenance      │   │
              │   │  5. validate vs v0.2         │   │
              │   └──────────────────────────────┘   │
              └──────────────────┬───────────────────┘
                                 │
                                 ▼
                          v0.2.json output
```

## Module map

| File                              | Responsibility                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/cli.mjs`                     | argv parsing, subcommand dispatch (migrate/validate), I/O                                     |
| `src/schema/pmf-v0.1.mjs`         | Zod schema for PMF v0.1 (mirrors context-portability)                                         |
| `src/schema/pmf-v0.2.mjs`         | Zod schema for PMF v0.2 (extends v0.1 with tags, expires_at, provenance)                      |
| `src/migrations/v0.1-to-v0.2.mjs` | Pure function transforming v0.1 docs into v0.2 shape (engine populates provenance separately) |
| `src/migrations/registry.mjs`     | Known versions, latest version, and path-resolver                                             |
| `src/engine.mjs`                  | runMigration: validate → resolve path → apply → populate provenance → validate                |
| `src/audit.mjs`                   | Outbound-fetch audit wrapper (verbatim from sibling projects)                                 |
| `benchmark/run.mjs`               | 30-sample migration-fidelity harness                                                          |
| `benchmark/score.mjs`             | Per-sample scorer (count, text, tags, provenance)                                             |

## Two version axes

The repo has two independent versions:

1. **Format version (PMF):** what the spec describes. Starts at v0.1 (in context-portability), introduces v0.2 here.
2. **Package version (format-survives-upgrades):** what semver the CLI is at. Starts at `0.1.0`.

The migrator field is `<package-name>@<package-version>` (e.g., `format-survives-upgrades@0.1.0`). The format `version` field is the spec version (e.g., `0.2`).

## Determinism

Production CLI uses real time for `provenance.migrated_at`. Tests and the benchmark inject a fixed `now` so output is byte-identical across runs. This is the only non-deterministic part of the pipeline — every other transformation is pure function over its input.

## Privacy at runtime

The pipeline makes zero outbound HTTP calls. Even so, an audit-fetch wrapper (`src/audit.mjs`, copied verbatim from sibling projects) is in place so that any future feature that adds network I/O inherits the audit infrastructure. The benchmark runner truncates the audit log at start and asserts no `internal: false` entries at end.

## Why no LLM in the migration?

Three reasons:

1. **Privacy story.** "Zero external calls" is verifiable. LLM-assisted migration would either pin you to a specific model or force a privacy compromise.
2. **Determinism.** Pure-function migrations are repeatable. Same input → same output, every time.
3. **Inverse-bus-factor.** A pure transform can be reviewed line-by-line. An LLM-generated migration is opaque — you can't tell whether the model dropped a field, hallucinated a default, or mis-parsed an edge case.

LLM-assisted normalization (cleanup, deduplication, semantic merging) remains an open v0.2 candidate gated by alpha signal — but specifically as an OPTIONAL post-pass behind an explicit flag, never silently.

## Migration step shape

All migration steps share a uniform shape:

```js
export default {
  from: '0.N',
  to: '0.N+1',
  apply(doc) {
    /* pure function returning the new shape */
  },
};
```

The engine handles the orchestration: which migration to run, in what order (for multi-hop migrations in future versions), and populating provenance. Steps just transform shape.

## Threat model (alpha)

- **In scope:** preventing data exfiltration during migration. Audit log + benchmark assertion guard against it.
- **Out of scope:** prompt-injection-laced docs, malicious vendor data attempting to crash the engine. The Zod schemas prevent type confusion; the engine catches malformed JSON; beyond that, garbage in → error out.
