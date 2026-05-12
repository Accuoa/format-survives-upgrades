# format-survives-upgrades

> **AI memory format versioning + migration.** PMF v0.1 → v0.2 in one command. Spec for how AI memory formats should declare versions; reference CLI that demonstrates the rules.

[![alpha demo](https://img.shields.io/badge/status-alpha%20demo-orange)](https://accuoa.github.io/format-survives-upgrades/)

## Headline numbers

On a 30-sample round-trip benchmark (15 happy-path + 10 edge-case + 5 malformed):

- **100% migration fidelity** (every memory survives v0.1 → v0.2; malformed inputs error cleanly)
- **0 external network calls** (verified by audit log)
- **Three byte-identical runs** (deterministic via injected `now`)

Reproduce yourself: clone, `npm install`, `npm run benchmark`. Methodology in [`calibration.md`](./calibration.md).

## What this is

- A **versioning rules spec** ([`SPEC.md`](./SPEC.md)) — how AI memory formats should declare versions, what forward/backward compat means, how migrations should be declared. Vendor-neutral.
- A **PMF v0.2 schema** (extends [Plan 5's v0.1](https://github.com/Accuoa/context-portability) with `tags`, `expires_at`, and `provenance`).
- A **Node CLI** that demonstrates the rules on PMF — migrates v0.1 docs to v0.2 with computed provenance.

## Quickstart

```bash
git clone https://github.com/Accuoa/format-survives-upgrades.git
cd format-survives-upgrades
npm install

# Migrate a PMF v0.1 doc to v0.2
node src/cli.mjs migrate --in examples/sample-v0.1.json --out ./out/sample-v0.2.json

# Validate either version
node src/cli.mjs validate --file ./out/sample-v0.2.json
node src/cli.mjs validate --file examples/sample-v0.1.json
```

The migrated output gets a `provenance` block that records what migrated it, when, and from what version:

```json
"provenance": {
  "migrated_from": "0.1",
  "migrated_at": "2026-05-12T12:00:00.000Z",
  "migrator": "format-survives-upgrades@0.1.0"
}
```

## Full chain: ChatGPT export → migrate → memorystore

If you also run [context-portability](https://github.com/Accuoa/context-portability) (Plan 5) and [memorystore](https://github.com/Accuoa/memorystore) (Plan 4):

```bash
# 1. ChatGPT export → PMF v0.1
node ../context-portability/src/cli.mjs convert --in user.json --out ./pmf-v01/

# 2. PMF v0.1 → v0.2
node src/cli.mjs migrate --in ./pmf-v01/portable.json --out ./pmf-v02/portable.json

# 3. (Use ./pmf-v01/memorystore.jsonl from context-portability if you want to POST to memorystore.)
```

See [`examples/migrate-and-pipe.sh`](./examples/migrate-and-pipe.sh) for the full version with error handling.

## What's in the box

- **CLI** (`src/cli.mjs`) — `migrate` and `validate` subcommands
- **Versioning rules** ([`SPEC.md`](./SPEC.md)) — vendor-neutral, MIT-licensed
- **PMF v0.1 + v0.2 Zod schemas** — both validate
- **Reference migration** (v0.1 → v0.2) — pure-function step
- **30-sample benchmark** — verify migration fidelity end-to-end

## Status

`alpha demo` — migrate + validate work, versioning rules spec is published, benchmark passes. Vendor schema diff registry, bidirectional migration, and additional format support are all ROADMAP items gated by signal.

## License

MIT — see [LICENSE](./LICENSE). The versioning rules in [SPEC.md](./SPEC.md) are also MIT.
