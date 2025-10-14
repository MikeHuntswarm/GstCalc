import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AtoRates } from '@/types/ato';

interface CachedRates {
  timestamp: number;
  data: AtoRates;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

const CACHE_KEY = 'gstcalc::atoRates';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // one week

const DEFAULT_REMOTE_URL =
  import.meta.env.VITE_ATO_RATES_URL ?? 'https://gstcalc.github.io/data/ato-rates.json';
const LOCAL_URL = 'data/ato-rates.json';

function readCache(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedRates;
    if (!parsed?.data) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to read cached ATO rates', error);
    return null;
  }
}

function writeCache(data: AtoRates) {
  try {
    const payload: CachedRates = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to cache ATO rates', error);
  }
}

async function fetchJson(url: string): Promise<AtoRates> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch rates from ${url}`);
  }

  return (await response.json()) as AtoRates;
}

export function useAtoRates() {
  const cached = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return readCache();
  }, []);

  const [data, setData] = useState<AtoRates | null>(cached?.data ?? null);
  const [status, setStatus] = useState<Status>(cached ? 'ready' : 'idle');
  const [error, setError] = useState<string | undefined>();
  const [stale, setStale] = useState(() => {
    if (!cached) {
      return false;
    }
    return Date.now() - cached.timestamp > CACHE_MAX_AGE;
  });

  const loadRates = useCallback(
    async (forceRefresh = false) => {
      setStatus((current) => (current === 'idle' ? 'loading' : 'loading'));
      setError(undefined);

      const sources: string[] = [];
      if (!forceRefresh && cached && !stale) {
        setData(cached.data);
        setStatus('ready');
        return;
      }

      if (DEFAULT_REMOTE_URL) {
        sources.push(DEFAULT_REMOTE_URL);
      }
      sources.push(LOCAL_URL);

      let lastError: unknown;
      for (const url of sources) {
        try {
          const freshData = await fetchJson(url);
          setData(freshData);
          setStatus('ready');
          setStale(false);
          writeCache(freshData);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      setStatus(data ? 'ready' : 'error');
      setError(lastError instanceof Error ? lastError.message : 'Unable to load rates');
      setStale(true);
    },
    [cached, data, stale],
  );

  useEffect(() => {
    let cancelled = false;

    if (!cached || stale) {
      loadRates().catch((err) => {
        if (!cancelled) {
          console.error(err);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [cached, loadRates, stale]);

  const refresh = useCallback(async () => {
    await loadRates(true);
  }, [loadRates]);

  return {
    data,
    status,
    error,
    stale,
    refresh,
  } as const;
}
