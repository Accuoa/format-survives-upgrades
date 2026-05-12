import { describe, it, expect } from 'vitest';
import { PortableMemoryV01Schema, validatePortableV01 } from '../src/schema/pmf-v0.1.mjs';

describe('PortableMemoryV01Schema', () => {
  it('accepts a valid minimal v0.1 document', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [],
    };
    expect(() => PortableMemoryV01Schema.parse(doc)).not.toThrow();
  });

  it('accepts a document with memories', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai', exported_at: '2026-05-01T00:00:00Z' },
      memories: [
        { id: 'abc123', text: 'I prefer dark mode.', metadata: { category: 'preference' } },
      ],
    };
    expect(() => PortableMemoryV01Schema.parse(doc)).not.toThrow();
  });

  it('accepts metadata with catchall fields (forward-compat)', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [
        { id: 'abc', text: 'Hi', metadata: { tags: ['x'], expires_at: '2030-01-01T00:00:00Z' } },
      ],
    };
    expect(() => PortableMemoryV01Schema.parse(doc)).not.toThrow();
  });

  it('rejects documents with wrong format string', () => {
    const doc = {
      format: 'something-else',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [],
    };
    expect(() => PortableMemoryV01Schema.parse(doc)).toThrow();
  });

  it('rejects documents with wrong version literal', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.2',
      source: { vendor: 'openai' },
      memories: [],
    };
    expect(() => PortableMemoryV01Schema.parse(doc)).toThrow();
  });

  it('rejects memories missing required text', () => {
    const doc = {
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [{ id: 'abc' }],
    };
    expect(() => PortableMemoryV01Schema.parse(doc)).toThrow();
  });
});

describe('validatePortableV01', () => {
  it('returns ok=true for valid input', () => {
    const result = validatePortableV01({
      format: 'portable-memory-format',
      version: '0.1',
      source: { vendor: 'openai' },
      memories: [],
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns ok=false with a list of errors for invalid input', () => {
    const result = validatePortableV01({ format: 'wrong', version: '0.1' });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(typeof result.errors[0]).toBe('string');
  });
});
