import { describe, it, expect } from 'vitest';
import { PortableMemoryV02Schema, validatePortableV02, MemoryEntryV02Schema } from '../src/schema/pmf-v0.2.mjs';

describe('PortableMemoryV02Schema', () => {
  it('accepts a valid minimal v0.2 document', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.2',
      source: { vendor: 'openai' },
      memories: [],
    };
    expect(() => PortableMemoryV02Schema.parse(doc)).not.toThrow();
  });

  it('accepts v0.2 document with provenance', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.2',
      source: { vendor: 'openai' },
      provenance: {
        migrated_from: '0.1',
        migrated_at: '2026-05-12T00:00:00.000Z',
        migrator: 'format-survives-upgrades@0.1.0',
      },
      memories: [],
    };
    expect(() => PortableMemoryV02Schema.parse(doc)).not.toThrow();
  });

  it('accepts v0.2 document without provenance (native v0.2)', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.2',
      source: { vendor: 'openai' },
      memories: [{ id: 'a', text: 'x', metadata: { tags: [] } }],
    };
    expect(() => PortableMemoryV02Schema.parse(doc)).not.toThrow();
  });

  it('rejects documents with wrong version literal', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [],
    };
    expect(() => PortableMemoryV02Schema.parse(doc)).toThrow();
  });

  it('rejects provenance missing migrator field', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.2',
      source: { vendor: 'openai' },
      provenance: { migrated_from: '0.1', migrated_at: '2026-05-12T00:00:00.000Z' },
      memories: [],
    };
    expect(() => PortableMemoryV02Schema.parse(doc)).toThrow();
  });
});

describe('MemoryEntryV02Schema', () => {
  it('accepts entries with tags and expires_at in metadata', () => {
    const entry = {
      id: 'abc',
      text: 'Hi',
      metadata: { tags: ['preference', 'ui'], expires_at: '2030-01-01T00:00:00Z' },
    };
    expect(() => MemoryEntryV02Schema.parse(entry)).not.toThrow();
  });

  it('defaults metadata.tags to empty array', () => {
    const entry = { id: 'abc', text: 'Hi', metadata: {} };
    const parsed = MemoryEntryV02Schema.parse(entry);
    expect(parsed.metadata.tags).toEqual([]);
  });

  it('rejects non-string tags', () => {
    const entry = { id: 'abc', text: 'Hi', metadata: { tags: [123] } };
    expect(() => MemoryEntryV02Schema.parse(entry)).toThrow();
  });

  it('rejects non-string expires_at', () => {
    const entry = { id: 'abc', text: 'Hi', metadata: { expires_at: 1730000000 } };
    expect(() => MemoryEntryV02Schema.parse(entry)).toThrow();
  });
});

describe('validatePortableV02', () => {
  it('returns ok=true for valid input', () => {
    const result = validatePortableV02({
      format: 'portable-memory-format',
      version: '0.2',
      source: { vendor: 'openai' },
      memories: [],
    });
    expect(result.ok).toBe(true);
  });

  it('returns ok=false with errors for invalid input', () => {
    const result = validatePortableV02({ format: 'wrong', version: '0.2' });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
