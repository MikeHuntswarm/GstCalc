/**
 * ATO rates cache — pure functions for the localStorage cache with
 * staleness policy. Extracted from store/ato.ts so the policy is
 * unit-testable without React or mocking fetch.
 */
import type { AtoData } from '@/types/ato';
import { AtoDataSchema } from '@/types/ato.schema';
import { CACHE_EXPIRY_MS } from '@/lib/constants';

export interface AtoCacheEntry {
  timestamp: number;
  data: AtoData;
}

export const ATO_CACHE_KEY = 'gstcalc-ato-rates';

/** Read + schema-validate the cached entry. Returns null if absent/corrupt/invalid. */
export function readCachedAto(): AtoCacheEntry | null {
  try {
    const raw = localStorage.getItem(ATO_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AtoCacheEntry>;
    if (typeof parsed.timestamp !== 'number' || !parsed.data) {
      return null;
    }

    // Validate against the schema — invalid cached data is treated as absent
    const data = AtoDataSchema.parse(parsed.data);
    return { timestamp: parsed.timestamp, data };
  } catch {
    // Corrupt or unparsable
    return null;
  }
}

/** Write a timestamped, validated entry to the cache. */
export function writeCachedAto(data: AtoData): void {
  const entry: AtoCacheEntry = { timestamp: Date.now(), data };
  localStorage.setItem(ATO_CACHE_KEY, JSON.stringify(entry));
}

/** Remove the cache entry entirely. */
export function clearCachedAto(): void {
  localStorage.removeItem(ATO_CACHE_KEY);
}

/** Is the cached entry older than the expiry window? */
export function isCacheExpired(entry: AtoCacheEntry, now = Date.now()): boolean {
  return now - entry.timestamp >= CACHE_EXPIRY_MS;
}

/** Recursively sort object keys so payload comparison is order-insensitive. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Is the fresh payload different from the cached one?
 * Order-insensitive comparison via deep key sorting — a reordered JSON
 * payload is not treated as a change.
 */
export function isPayloadDifferent(fresh: AtoData, cached: AtoData): boolean {
  return JSON.stringify(canonicalize(fresh)) !== JSON.stringify(canonicalize(cached));
}
