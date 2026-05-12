import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runMigration } from '../src/engine.mjs';
import { truncateAuditLog, countExternalCalls } from '../src/audit.mjs';
import { scoreSample } from './score.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIXED_NOW = () => '2026-05-12T12:00:00.000Z';
const FIXED_MIGRATOR = 'format-survives-upgrades@0.1.0';

function loadJsonl(p) {
  return readFileSync(p, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function pct(x) {
  return (x * 100).toFixed(1) + '%';
}

function main() {
  const auditLogPath = join(__dirname, '..', 'logs', 'network.jsonl');
  truncateAuditLog(auditLogPath);

  const samples = loadJsonl(join(__dirname, 'data', 'samples.jsonl'));
  const expectedAll = loadJsonl(join(__dirname, 'data', 'expected.jsonl'));

  if (samples.length !== expectedAll.length) {
    console.error(`mismatch: ${samples.length} samples but ${expectedAll.length} expected rows`);
    process.exit(1);
  }

  console.log(`[format-survives-upgrades] running benchmark — ${samples.length} samples`);

  let happyPass = 0;
  let edgePass = 0;
  let malformedPass = 0;
  const happyTotal = 15;
  const edgeTotal = 10;
  const malformedTotal = 5;
  const failures = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const expected = expectedAll[i];

    let actual;
    if (sample.__malformed__) {
      try {
        const parsed = JSON.parse(sample.__raw_input__);
        const result = runMigration(parsed, '0.2', { now: FIXED_NOW, migrator: FIXED_MIGRATOR });
        actual = { ok: true, doc: result };
      } catch (err) {
        actual = { ok: false, error: String(err.message ?? err) };
      }
    } else {
      try {
        const result = runMigration(sample, '0.2', { now: FIXED_NOW, migrator: FIXED_MIGRATOR });
        actual = { ok: true, doc: result };
      } catch (err) {
        actual = { ok: false, error: String(err.message ?? err) };
      }
    }

    const score = scoreSample(actual, expected);
    if (score.passed) {
      if (i < 15) happyPass++;
      else if (i < 25) edgePass++;
      else malformedPass++;
    } else {
      failures.push({ index: i + 1, reason: score.reason });
    }
  }

  const totalPass = happyPass + edgePass + malformedPass;

  console.log('');
  console.log(`  parsing samples...    ${samples.length}/${samples.length} OK`);
  console.log(`  scoring...            ${samples.length}/${samples.length} OK`);
  console.log('');
  console.log('FIDELITY:');
  console.log(
    `  happy-path (${happyTotal}):  ${happyPass}/${happyTotal} (${pct(happyPass / happyTotal)})`,
  );
  console.log(
    `  edge-case (${edgeTotal}):   ${edgePass}/${edgeTotal} (${pct(edgePass / edgeTotal)})`,
  );
  console.log(
    `  malformed (${malformedTotal}):    ${malformedPass}/${malformedTotal} errored cleanly (${pct(malformedPass / malformedTotal)})`,
  );
  console.log('');
  console.log(
    `  total:                ${totalPass}/${samples.length} (${pct(totalPass / samples.length)})`,
  );

  const externalCalls = countExternalCalls(auditLogPath);
  console.log('');
  console.log('NETWORK FOOTPRINT:');
  console.log(`  external calls:  ${externalCalls}`);
  console.log(`  audit log:       ${auditLogPath}`);
  console.log('');

  let band;
  if (totalPass === samples.length && externalCalls === 0) band = 'Strong';
  else if (totalPass / samples.length >= 0.95 && externalCalls === 0) band = 'Acceptable';
  else band = 'Weak';
  console.log(`STATUS: ${band} band`);

  if (failures.length) {
    console.log('');
    console.log('Failures:');
    for (const f of failures) console.log(`  sample ${f.index}: ${f.reason}`);
  }

  if (externalCalls > 0) {
    console.error('');
    console.error('FAIL: benchmark detected external network calls. Privacy claim broken.');
    process.exit(2);
  }

  if (band === 'Weak') {
    process.exit(3);
  }
}

main();
