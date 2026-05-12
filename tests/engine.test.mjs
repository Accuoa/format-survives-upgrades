import { describe, it, expect } from 'vitest';
import { runMigration } from '../src/engine.mjs';

const fixedNow = () => '2026-05-12T12:00:00.000Z';
const fixedMigrator = 'format-survives-upgrades@0.1.0';

const validV01 = {
  format: 'portable-memory-format',
  version: '0.1',
  source: { vendor: 'openai' },
  memories: [{ id: 'a', text: 'Memory A', metadata: { source_id: 'm1' } }],
};

describe('runMigration', () => {
  it('migrates v0.1 → v0.2 and populates provenance', () => {
    const result = runMigration(validV01, '0.2', { now: fixedNow, migrator: fixedMigrator });
    expect(result.version).toBe('0.2');
    expect(result.provenance).toEqual({
      migrated_from: '0.1',
      migrated_at: '2026-05-12T12:00:00.000Z',
      migrator: 'format-survives-upgrades@0.1.0',
    });
  });

  it('preserves source and memory ids', () => {
    const result = runMigration(validV01, '0.2', { now: fixedNow, migrator: fixedMigrator });
    expect(result.source).toEqual({ vendor: 'openai' });
    expect(result.memories[0].id).toBe('a');
  });

  it('returns input unchanged when from === to (idempotent, no provenance added)', () => {
    const result = runMigration(validV01, '0.1', { now: fixedNow, migrator: fixedMigrator });
    expect(result).toEqual(validV01);
    expect(result).not.toHaveProperty('provenance');
  });

  it('throws when input fails validation against declared version', () => {
    const bad = { format: 'wrong', version: '0.1', source: { vendor: 'x' }, memories: [] };
    expect(() => runMigration(bad, '0.2', { now: fixedNow, migrator: fixedMigrator })).toThrow(/validation/i);
  });

  it('throws when input lacks a version field', () => {
    const bad = { format: 'portable-memory-format', source: { vendor: 'x' }, memories: [] };
    expect(() => runMigration(bad, '0.2', { now: fixedNow, migrator: fixedMigrator })).toThrow(/version/i);
  });

  it('throws on downgrade attempt (v0.2 → v0.1)', () => {
    const v02 = { ...validV01, version: '0.2', memories: [{ ...validV01.memories[0], metadata: { ...validV01.memories[0].metadata, tags: [] } }] };
    expect(() => runMigration(v02, '0.1', { now: fixedNow, migrator: fixedMigrator })).toThrow(/no migration path from 0.2 to 0.1/i);
  });

  it('output validates against target version schema', () => {
    const result = runMigration(validV01, '0.2', { now: fixedNow, migrator: fixedMigrator });
    expect(result.memories[0].metadata.tags).toEqual([]);
  });

  it('does not mutate input', () => {
    const snapshot = JSON.parse(JSON.stringify(validV01));
    runMigration(validV01, '0.2', { now: fixedNow, migrator: fixedMigrator });
    expect(validV01).toEqual(snapshot);
  });

  it('is deterministic when now and migrator are fixed', () => {
    const a = runMigration(validV01, '0.2', { now: fixedNow, migrator: fixedMigrator });
    const b = runMigration(validV01, '0.2', { now: fixedNow, migrator: fixedMigrator });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('preserves catchall fields in metadata during migration', () => {
    const input = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: { custom_field: 'preserved' } }],
    };
    const result = runMigration(input, '0.2', { now: fixedNow, migrator: fixedMigrator });
    expect(result.memories[0].metadata.custom_field).toBe('preserved');
  });
});
