import { describe, it, expect, beforeEach } from 'vitest';
import type { AtoData } from '../types/ato';
import {
  readCachedAto,
  writeCachedAto,
  clearCachedAto,
  isCacheExpired,
  isPayloadDifferent,
  ATO_CACHE_KEY,
} from './atoCache';

const sample: AtoData = {
  metadata: { source: 'test', lastUpdated: '2026-07-09' },
  gst: { standardRate: 0.1, notes: 'test' },
  individual: { financialYears: [], medicare: undefined, offsets: [] },
  company: {
    baseRateEntity: { rate: 0.25, criteria: 'test' },
    fullRate: { rate: 0.3, criteria: 'test' },
  },
  penalties: {
    failureToLodge: { unitValue: 364, maxUnits: 5, frequencyDays: 28, description: 'test' },
    generalInterestCharge: { description: 'test' },
  },
};

describe('atoCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is cached', () => {
    expect(readCachedAto()).toBeNull();
  });

  it('round-trips a written entry', () => {
    writeCachedAto(sample);
    const entry = readCachedAto();
    expect(entry).not.toBeNull();
    expect(entry!.data.gst.standardRate).toBe(0.1);
    expect(entry!.data.metadata.lastUpdated).toBe('2026-07-09');
    expect(typeof entry!.timestamp).toBe('number');
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(ATO_CACHE_KEY, '{not valid json');
    expect(readCachedAto()).toBeNull();
  });

  it('returns null when cached data fails schema validation', () => {
    localStorage.setItem(
      ATO_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data: { gst: { standardRate: 'oops' } } }),
    );
    expect(readCachedAto()).toBeNull();
  });

  it('clears the cache', () => {
    writeCachedAto(sample);
    clearCachedAto();
    expect(localStorage.getItem(ATO_CACHE_KEY)).toBeNull();
  });

  it('isCacheExpired respects the expiry window', () => {
    writeCachedAto(sample);
    const entry = readCachedAto()!;
    expect(isCacheExpired(entry, entry.timestamp)).toBe(false);
    // 7 days + 1ms later → expired
    expect(isCacheExpired(entry, entry.timestamp + 7 * 24 * 60 * 60 * 1000 + 1)).toBe(true);
  });

  it('isPayloadDifferent detects real changes', () => {
    const changed = structuredClone(sample);
    changed.gst.standardRate = 0.11;
    expect(isPayloadDifferent(changed, sample)).toBe(true);
  });

  it('isPayloadDifferent ignores key reordering', () => {
    const reordered: AtoData = {
      penalties: sample.penalties,
      company: sample.company,
      individual: sample.individual,
      gst: sample.gst,
      metadata: sample.metadata,
    };
    expect(isPayloadDifferent(reordered, sample)).toBe(false);
  });

  it('isPayloadDifferent returns false for identical payloads', () => {
    expect(isPayloadDifferent(structuredClone(sample), sample)).toBe(false);
  });
});
