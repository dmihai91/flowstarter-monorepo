import type { ProjectWithOwner } from '@/hooks/useTeamProjects';

export type Project = ProjectWithOwner;

export function fieldsDirty<T extends Record<string, unknown>>(
  base: T,
  next: T
): boolean {
  for (const key of Object.keys(next)) {
    const a = base[key];
    const b = next[key];
    if (a === b) continue;
    if (a == null && b == null) continue;
    if (typeof a === 'object' && typeof b === 'object') {
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
      continue;
    }
    return true;
  }
  return false;
}

export function nonNegativeIntOrZero(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
