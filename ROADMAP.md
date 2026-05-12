# Roadmap

## Done — v0.1 alpha

- PMF v0.2 spec (extends v0.1 with tags, expires_at, provenance)
- Versioning rules spec (vendor-neutral, in SPEC.md Part 1)
- CLI with `migrate` + `validate` subcommands
- v0.1 → v0.2 migration step
- Engine with path resolution, idempotency, and computed provenance
- 30-sample migration-fidelity benchmark
- Audit-fetch wrapper for runtime privacy claims
- CHANGELOG.md anchored on format version

## In flight

- Validation period: 30-day signal-collection window per the [portfolio strategy](https://github.com/Accuoa). v0.2-of-this-repo scope depends on what people do with the alpha.

## Planned (v0.2-of-this-repo candidates — pick from based on alpha signal)

- **Vendor schema diff registry** — track ChatGPT export format evolution, Claude Projects schema changes, Cursor rules format updates. A migration tool needs to know what vendors emit; today it only knows about PMF.
- **Bidirectional migration** — v0.2 → v0.1 downgrade with documented lossy paths (drops `tags`, `expires_at`, `provenance`).
- **Multi-format support** — generalize the engine to handle Mem0 and Letta with their own version registries and migration scripts.
- **`diff` subcommand** — print human-readable schema diff between any two known versions.
- **LLM-assisted optional pass** — explicit `--llm-cleanup` flag for migrations that benefit from semantic normalization (dedup, summarization). Never silent; always opt-in.
- **PMF v0.3** — additional additive fields informed by alpha feedback.

## Out of scope (probably never)

- Migrating non-AI-memory formats (e.g., generic JSON schema migration). Different problem.
- Hosted SaaS migration service.
- Storing user data — this tool transforms files; it doesn't keep them.
