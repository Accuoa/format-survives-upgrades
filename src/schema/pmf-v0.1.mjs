import { z } from 'zod';

export const MemoryEntryV01Schema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  metadata: z
    .object({
      category: z.string().optional(),
      source_id: z.string().optional(),
      created_at: z.string().optional(),
    })
    .catchall(z.unknown())
    .default({}),
});

export const PortableMemoryV01Schema = z.object({
  format: z.literal('portable-memory-format'),
  version: z.literal('0.1'),
  source: z.object({
    vendor: z.string().min(1),
    exported_at: z.string().optional(),
  }),
  memories: z.array(MemoryEntryV01Schema),
});

export function validatePortableV01(input) {
  const result = PortableMemoryV01Schema.safeParse(input);
  if (result.success) {
    return { ok: true, errors: [] };
  }
  return {
    ok: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
