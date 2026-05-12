import { describe, it, expect } from 'vitest';
import { scoreSample } from '../benchmark/score.mjs';

describe('scoreSample', () => {
  it('passes for happy path with matching count, text, tags, and provenance', () => {
    const actual = {
      ok: true,
      doc: {
        memories: [
          { text: 'A', metadata: { tags: [] } },
          { text: 'B', metadata: { tags: [] } },
        ],
        provenance: { migrated_from: '0.1' },
      },
    };
    const expected = {
      memories_count: 2,
      first_text: 'A',
      first_metadata_tags: [],
      has_provenance: true,
      provenance_migrated_from: '0.1',
    };
    expect(scoreSample(actual, expected).passed).toBe(true);
  });

  it('fails when memories_count mismatches', () => {
    const actual = {
      ok: true,
      doc: {
        memories: [{ text: 'A', metadata: { tags: [] } }],
        provenance: { migrated_from: '0.1' },
      },
    };
    const expected = {
      memories_count: 2,
      first_text: 'A',
      first_metadata_tags: [],
      has_provenance: true,
      provenance_migrated_from: '0.1',
    };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/count/i);
  });

  it('fails when first_text mismatches', () => {
    const actual = {
      ok: true,
      doc: {
        memories: [{ text: 'X', metadata: { tags: [] } }],
        provenance: { migrated_from: '0.1' },
      },
    };
    const expected = {
      memories_count: 1,
      first_text: 'A',
      first_metadata_tags: [],
      has_provenance: true,
      provenance_migrated_from: '0.1',
    };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/text/i);
  });

  it('fails when first_metadata_tags mismatches', () => {
    const actual = {
      ok: true,
      doc: {
        memories: [{ text: 'A', metadata: { tags: ['extra'] } }],
        provenance: { migrated_from: '0.1' },
      },
    };
    const expected = {
      memories_count: 1,
      first_text: 'A',
      first_metadata_tags: [],
      has_provenance: true,
      provenance_migrated_from: '0.1',
    };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/tags/i);
  });

  it('fails when provenance is missing', () => {
    const actual = { ok: true, doc: { memories: [], provenance: undefined } };
    const expected = { memories_count: 0, has_provenance: true, provenance_migrated_from: '0.1' };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/provenance/i);
  });

  it('fails when provenance.migrated_from mismatches', () => {
    const actual = { ok: true, doc: { memories: [], provenance: { migrated_from: '0.0' } } };
    const expected = { memories_count: 0, has_provenance: true, provenance_migrated_from: '0.1' };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/migrated_from/i);
  });

  it('passes when memories_count is 0 and provenance is correct', () => {
    const actual = { ok: true, doc: { memories: [], provenance: { migrated_from: '0.1' } } };
    const expected = { memories_count: 0, has_provenance: true, provenance_migrated_from: '0.1' };
    expect(scoreSample(actual, expected).passed).toBe(true);
  });

  it('passes for malformed sample when error matches regex', () => {
    const actual = { ok: false, error: 'failed to parse JSON: ...' };
    const expected = { expected_error: 'json|parse' };
    expect(scoreSample(actual, expected).passed).toBe(true);
  });

  it('fails for malformed sample when actual succeeds', () => {
    const actual = { ok: true, doc: { memories: [], provenance: {} } };
    const expected = { expected_error: 'parse' };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/expected error/i);
  });

  it('fails for malformed sample when error regex does not match', () => {
    const actual = { ok: false, error: 'something else broke' };
    const expected = { expected_error: 'json|parse' };
    const r = scoreSample(actual, expected);
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/did not match/i);
  });
});
