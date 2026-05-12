# Usage

## Install

```bash
git clone https://github.com/Accuoa/format-survives-upgrades.git
cd format-survives-upgrades
npm install
```

## CLI

### `migrate`

Migrate a PMF doc from one version to another.

```bash
node src/cli.mjs migrate --in <input-file> --out <output-file> [--to <version>]
```

| Flag          | Required | Default      | Meaning                                                      |
| ------------- | -------- | ------------ | ------------------------------------------------------------ |
| `--in`, `-i`  | yes      | —            | path to input doc (any known version)                        |
| `--out`, `-o` | yes      | —            | path to write migrated doc (mkdir -p applied for parent dir) |
| `--to`, `-t`  | no       | latest known | target version (e.g. `0.2`)                                  |

Exit codes: 0 success, 1 read/parse error, 2 usage error, 3 migration failure.

The output contains a `provenance` block recording what migrated it.

### `validate`

Validate that a doc conforms to its declared `version`'s schema.

```bash
node src/cli.mjs validate --file <path>
```

Exits 0 if valid, 1 with error list if not. Auto-detects whether the doc is v0.1 or v0.2 from the `version` field.

### `--version` / `--help`

Self-explanatory.

## Programmatic use

```js
import { runMigration } from 'format-survives-upgrades/src/engine.mjs';

const doc = JSON.parse(readFileSync('user-v0.1.json', 'utf-8'));
const migrated = runMigration(doc, '0.2');

// migrated.version === '0.2'
// migrated.provenance is populated
// migrated.memories has the new metadata.tags = [] defaults
```

Override `now` and `migrator` for tests:

```js
const migrated = runMigration(doc, '0.2', {
  now: () => '2026-05-12T12:00:00.000Z',
  migrator: 'my-migration-test@0.0.0',
});
```

## Piping through the chain

The repo plays nicely with its sibling projects:

```bash
# ChatGPT export → PMF v0.1 (via context-portability)
node ../context-portability/src/cli.mjs convert --in user.json --out ./step1/

# PMF v0.1 → v0.2
node src/cli.mjs migrate --in ./step1/portable.json --out ./step2/portable.json

# (Then pipe to memorystore via the JSONL emitter from context-portability if you want)
```

See [`examples/migrate-and-pipe.sh`](./examples/migrate-and-pipe.sh) for the full script.

## Reproducing the headline numbers

```bash
npm run benchmark
```

The benchmark uses 30 committed samples (`benchmark/data/`). Anyone can rerun. Output is deterministic — three runs produce byte-identical results.

## Limitations (alpha)

- Only PMF (the format from context-portability) is supported. Mem0, Letta, etc. are v0.2+ candidates.
- Bidirectional migration (v0.2 → v0.1) is not supported.
- Vendor schema diff registry (ChatGPT export format evolution) is out of scope in v0.1 of this repo.
- LLM-assisted migration is explicitly out — same privacy story as Plans 4 and 5.
