import v01ToV02 from './v0.1-to-v0.2.mjs';

const migrations = [v01ToV02];

export const knownVersions = ['0.1', '0.2'];
export const latestVersion = '0.2';

export function resolveMigrationPath(from, to) {
  if (!knownVersions.includes(from)) {
    throw new Error(`unknown source version: ${from} (known: ${knownVersions.join(', ')})`);
  }
  if (!knownVersions.includes(to)) {
    throw new Error(`unknown target version: ${to} (known: ${knownVersions.join(', ')})`);
  }
  if (from === to) return [];

  const path = [];
  let current = from;
  while (current !== to) {
    const next = migrations.find((m) => m.from === current);
    if (!next) {
      throw new Error(`no migration path from ${from} to ${to}`);
    }
    path.push(next);
    current = next.to;
    if (path.length > migrations.length) {
      throw new Error(`migration cycle detected for ${from} → ${to}`);
    }
  }
  return path;
}
