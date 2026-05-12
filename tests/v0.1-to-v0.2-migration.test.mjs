import { describe, it, expect } from 'vitest';
import migration from '../src/migrations/v0.1-to-v0.2.mjs';

describe('migration v0.1 → v0.2', () => {
  it('declares from and to versions', () => {
    expect(migration.from).toBe('0.1');
    expect(migration.to).toBe('0.2');
  });

  it('updates version field from 0.1 to 0.2', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [],
    };
    const v2 = migration.apply(v1);
    expect(v2.version).toBe('0.2');
  });

  it('preserves format, source, and memory ids', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai', exported_at: '2026-01-01T00:00:00Z' },
      memories: [
        { id: 'abc123', text: 'Memory A', metadata: { source_id: 'mem-1' } },
        { id: 'def456', text: 'Memory B', metadata: {} },
      ],
    };
    const v2 = migration.apply(v1);
    expect(v2.format).toBe('portable-memory-format');
    expect(v2.source).toEqual({ vendor: 'openai', exported_at: '2026-01-01T00:00:00Z' });
    expect(v2.memories[0].id).toBe('abc123');
    expect(v2.memories[1].id).toBe('def456');
    expect(v2.memories[0].text).toBe('Memory A');
    expect(v2.memories[1].text).toBe('Memory B');
  });

  it('adds metadata.tags = [] when not present in v0.1', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: { source_id: 'm1' } }],
    };
    const v2 = migration.apply(v1);
    expect(v2.memories[0].metadata.tags).toEqual([]);
  });

  it('preserves existing metadata.tags from v0.1 catchall', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: { tags: ['preference', 'ui'] } }],
    };
    const v2 = migration.apply(v1);
    expect(v2.memories[0].metadata.tags).toEqual(['preference', 'ui']);
  });

  it('preserves existing metadata.expires_at from v0.1 catchall', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: { expires_at: '2030-01-01T00:00:00Z' } }],
    };
    const v2 = migration.apply(v1);
    expect(v2.memories[0].metadata.expires_at).toBe('2030-01-01T00:00:00Z');
  });

  it('omits metadata.expires_at when not present in v0.1', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: {} }],
    };
    const v2 = migration.apply(v1);
    expect(v2.memories[0].metadata).not.toHaveProperty('expires_at');
  });

  it('does NOT populate provenance (engine handles that)', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [],
    };
    const v2 = migration.apply(v1);
    expect(v2).not.toHaveProperty('provenance');
  });

  it('is deterministic (same input → same output)', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: {} }],
    };
    const a = migration.apply(v1);
    const b = migration.apply(v1);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not mutate input', () => {
    const v1 = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: { source_id: 'm1' } }],
    };
    const original = JSON.parse(JSON.stringify(v1));
    migration.apply(v1);
    expect(v1).toEqual(original);
  });
});
