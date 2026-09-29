type Queued = { sortKey: Date; createdAt: Date };

/** Ordena a lista e separa quem está dentro (até a capacidade) de quem está na espera. */
export function splitQueue<T extends Queued>(signups: T[], capacity: number | null) {
  const ordered = [...signups].sort(
    (a, b) =>
      a.sortKey.getTime() - b.sortKey.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  if (capacity == null) return { ordered, confirmed: ordered, waitlist: [] as T[] };
  return { ordered, confirmed: ordered.slice(0, capacity), waitlist: ordered.slice(capacity) };
}
