#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { runMigration } from './engine.mjs';
import { validatePortableV01 } from './schema/pmf-v0.1.mjs';
import { validatePortableV02 } from './schema/pmf-v0.2.mjs';
import { latestVersion } from './migrations/registry.mjs';

const VERSION = '0.1.0';

function printHelp() {
  console.log(`format-survives-upgrades ${VERSION}

AI memory format versioning + migration.

Usage:
  format-survives-upgrades migrate  --in <path> --out <path> [--to <version>]
  format-survives-upgrades validate --file <path>
  format-survives-upgrades --version
  format-survives-upgrades --help

Examples:
  format-survives-upgrades migrate --in user.json --out user-v0.2.json
  format-survives-upgrades migrate --in user.json --out user-v0.2.json --to 0.2
  format-survives-upgrades validate --file user-v0.2.json
`);
}

function commandMigrate(args) {
  const { values } = parseArgs({
    args,
    options: {
      in: { type: 'string', short: 'i' },
      out: { type: 'string', short: 'o' },
      to: { type: 'string', short: 't', default: latestVersion },
    },
    strict: true,
  });

  if (!values.in || !values.out) {
    console.error('error: --in <path> and --out <path> are required');
    return 2;
  }

  const inPath = resolve(values.in);
  const outPath = resolve(values.out);

  let raw;
  try {
    raw = readFileSync(inPath, 'utf-8');
  } catch (err) {
    console.error(`error: cannot read ${inPath}: ${err.message}`);
    return 1;
  }

  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    console.error(`error: input is not valid JSON: ${err.message}`);
    return 1;
  }

  let result;
  try {
    result = runMigration(doc, values.to);
  } catch (err) {
    console.error(`error: migration failed: ${err.message}`);
    return 3;
  }

  try {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  } catch (err) {
    console.error(`error: cannot write ${outPath}: ${err.message}`);
    return 1;
  }

  console.log(`migrated ${doc.version} → ${result.version} (${result.memories.length} memories)`);
  console.log(`  → ${outPath}`);
  return 0;
}

function commandValidate(args) {
  const { values } = parseArgs({
    args,
    options: { file: { type: 'string', short: 'f' } },
    strict: true,
  });

  if (!values.file) {
    console.error('error: --file <path> is required');
    return 2;
  }

  let raw;
  try {
    raw = readFileSync(resolve(values.file), 'utf-8');
  } catch (err) {
    console.error(`error: cannot read ${values.file}: ${err.message}`);
    return 1;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`error: input is not valid JSON: ${err.message}`);
    return 1;
  }

  const version = parsed.version;
  let result;
  if (version === '0.1') {
    result = validatePortableV01(parsed);
  } else if (version === '0.2') {
    result = validatePortableV02(parsed);
  } else {
    console.error(`error: unknown or missing version field: ${version}`);
    return 1;
  }

  if (result.ok) {
    console.log(`OK — input conforms to Portable Memory Format v${version}`);
    return 0;
  }
  console.error(`FAIL — schema errors:`);
  for (const e of result.errors) console.error(`  - ${e}`);
  return 1;
}

function main(argv) {
  const [, , command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }
  if (command === '--version' || command === '-v') {
    console.log(VERSION);
    return 0;
  }

  switch (command) {
    case 'migrate':
      return commandMigrate(rest);
    case 'validate':
      return commandValidate(rest);
    default:
      console.error(`error: unknown command: ${command}`);
      printHelp();
      return 2;
  }
}

const invokedAsScript = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedAsScript) {
  process.exit(main(process.argv));
}

export { main };
