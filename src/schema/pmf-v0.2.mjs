import { z } from 'zod';

export const MemoryEntryV02Schema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  metadata: z
    .object({
      category: z.string().optional(),
      source_id: z.string().optional(),
      created_at: z.string().optional(),
      tags: z.array(z.string()).default([]),
      expires_at: z.string().optional(),
    })
    .catchall(z.unknown())
    .default({}),
});

export const PortableMemoryV02Schema = z.object({
  format: z.literal('portable-memory-format'),
  version: z.literal('0.2'),
  source: z.object({
    vendor: z.string().min(1),
    exported_at: z.string().optional(),
  }),
  provenance: z
    .object({
      migrated_from: z.string().min(1),
      migrated_at: z.string().min(1),
      migrator: z.string().min(1),
    })
    .optional(),
  memories: z.array(MemoryEntryV02Schema),
});

export function validatePortableV02(input) {
  const result = PortableMemoryV02Schema.safeParse(input);
  if (result.success) {
    return { ok: true, errors: [] };
  }
  return {
    ok: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
