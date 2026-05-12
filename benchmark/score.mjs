export function scoreSample(actual, expected) {
  if ('expected_error' in expected) {
    if (actual.ok) {
      return {
        passed: false,
        reason: `expected error matching ${expected.expected_error} but got success`,
      };
    }
    const re = new RegExp(expected.expected_error, 'i');
    if (!re.test(actual.error)) {
      return {
        passed: false,
        reason: `error "${actual.error}" did not match pattern ${expected.expected_error}`,
      };
    }
    return { passed: true };
  }

  if (!actual.ok) {
    return { passed: false, reason: `unexpected error: ${actual.error}` };
  }

  const doc = actual.doc;

  if (doc.memories.length !== expected.memories_count) {
    return {
      passed: false,
      reason: `count mismatch: got ${doc.memories.length}, expected ${expected.memories_count}`,
    };
  }

  if (expected.memories_count > 0) {
    if (doc.memories[0].text !== expected.first_text) {
      return {
        passed: false,
        reason: `first text mismatch: got "${doc.memories[0].text}", expected "${expected.first_text}"`,
      };
    }
    if (
      JSON.stringify(doc.memories[0].metadata.tags) !== JSON.stringify(expected.first_metadata_tags)
    ) {
      return {
        passed: false,
        reason: `first metadata.tags mismatch: got ${JSON.stringify(doc.memories[0].metadata.tags)}, expected ${JSON.stringify(expected.first_metadata_tags)}`,
      };
    }
  }

  if (expected.has_provenance) {
    if (!doc.provenance) {
      return { passed: false, reason: `expected provenance to be present, got undefined` };
    }
    if (doc.provenance.migrated_from !== expected.provenance_migrated_from) {
      return {
        passed: false,
        reason: `provenance.migrated_from mismatch: got "${doc.provenance.migrated_from}", expected "${expected.provenance_migrated_from}"`,
      };
    }
  }

  return { passed: true };
}
