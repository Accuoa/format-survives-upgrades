import { describe, it, expect } from 'vitest';
import { knownVersions, latestVersion, resolveMigrationPath } from '../src/migrations/registry.mjs';

describe('knownVersions', () => {
  it('includes 0.1 and 0.2', () => {
    expect(knownVersions).toContain('0.1');
    expect(knownVersions).toContain('0.2');
  });
});

describe('latestVersion', () => {
  it('returns 0.2 (the highest known version)', () => {
    expect(latestVersion).toBe('0.2');
  });
});

describe('resolveMigrationPath', () => {
  it('returns empty array when from === to (no-op)', () => {
    expect(resolveMigrationPath('0.1', '0.1')).toEqual([]);
    expect(resolveMigrationPath('0.2', '0.2')).toEqual([]);
  });

  it('returns single-step path from 0.1 to 0.2', () => {
    const path = resolveMigrationPath('0.1', '0.2');
    expect(path).toHaveLength(1);
    expect(path[0].from).toBe('0.1');
    expect(path[0].to).toBe('0.2');
  });

  it('throws when source version is unknown', () => {
    expect(() => resolveMigrationPath('0.0', '0.2')).toThrow(/unknown source version/i);
  });

  it('throws when target version is unknown', () => {
    expect(() => resolveMigrationPath('0.1', '0.9')).toThrow(/unknown target version/i);
  });

  it('throws on downgrade (no v0.2 → v0.1 path in v0.1 of this repo)', () => {
    expect(() => resolveMigrationPath('0.2', '0.1')).toThrow(/no migration path from 0.2 to 0.1/i);
  });
});
