const ID_RE = /^([A-Za-z]+)-(\d+)$/;

export function idNumber(id: string): number | null {
  const match = ID_RE.exec(id);
  return match ? Number(match[2]) : null;
}

export function nextId(prefix: string, existing: readonly string[]): string {
  const max = existing
    .filter((id) => id.startsWith(`${prefix}-`))
    .reduce((acc, id) => Math.max(acc, idNumber(id) ?? 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function findDuplicateIds(ids: readonly string[]): string[][] {
  const groups = ids.reduce((acc, id) => {
    const match = ID_RE.exec(id);
    if (!match) return acc;
    const key = `${match[1]}-${Number(match[2])}`;
    return new Map(acc).set(key, [...(acc.get(key) ?? []), id]);
  }, new Map<string, string[]>());
  return [...groups.values()].filter((g) => g.length > 1).map((g) => [...g].sort());
}
