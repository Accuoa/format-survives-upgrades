import { validatePortableV01, PortableMemoryV01Schema } from './schema/pmf-v0.1.mjs';
import { validatePortableV02, PortableMemoryV02Schema } from './schema/pmf-v0.2.mjs';
import { resolveMigrationPath } from './migrations/registry.mjs';

const schemaByVersion = {
  '0.1': PortableMemoryV01Schema,
  '0.2': PortableMemoryV02Schema,
};

const DEFAULT_MIGRATOR = 'format-survives-upgrades@0.1.0';

export function runMigration(doc, targetVersion, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  const migrator = opts.migrator ?? DEFAULT_MIGRATOR;

  if (!doc || typeof doc !== 'object') {
    throw new Error('input doc must be an object');
  }
  const sourceVersion = doc.version;
  if (!sourceVersion) {
    throw new Error('input doc missing required field: version');
  }

  const sourceSchema = schemaByVersion[sourceVersion];
  if (!sourceSchema) {
    throw new Error(`unknown source version: ${sourceVersion}`);
  }

  const inputValidation = sourceSchema.safeParse(doc);
  if (!inputValidation.success) {
    const errors = inputValidation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`input validation failed: ${errors}`);
  }
  const validated = inputValidation.data;

  const path = resolveMigrationPath(sourceVersion, targetVersion);

  if (path.length === 0) {
    return validated;
  }

  let current = validated;
  for (const step of path) {
    current = step.apply(current);
  }

  current = {
    ...current,
    provenance: {
      migrated_from: sourceVersion,
      migrated_at: now(),
      migrator,
    },
  };

  const targetSchema = schemaByVersion[targetVersion];
  const outputValidation = targetSchema.safeParse(current);
  if (!outputValidation.success) {
    const errors = outputValidation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`output validation failed: ${errors}`);
  }

  return outputValidation.data;
}
