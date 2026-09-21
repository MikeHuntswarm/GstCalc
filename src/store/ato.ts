import { create } from 'zustand';
import type { AtoData } from '@/types/ato';
import { AtoDataSchema } from '@/types/ato.schema';
import { readCachedAto, writeCachedAto, isCacheExpired, isPayloadDifferent } from '@/lib/atoCache';

interface AtoState {
  data: AtoData | null;
  status: 'loading' | 'success' | 'error';
  error: string | null;
  stale: boolean;
  fetchAtoRates: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Relative path works in both dev (vite serves public/) and production (dist/data/)
const LOCAL_API_URL = './data/ato-rates.json';

async function fetchData(): Promise<AtoData> {
  const response = await fetch(LOCAL_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ATO rates: ${response.statusText}`);
  }
  const rawData = await response.json();
  return AtoDataSchema.parse(rawData);
}

export const useAtoStore = create<AtoState>((set) => ({
  data: null,
  status: 'loading',
  error: null,
  stale: false,

  fetchAtoRates: async () => {
    set({ status: 'loading' });
    try {
      // Serve from cache if fresh, still background-checking for staleness
      const cached = readCachedAto();
      if (cached && !isCacheExpired(cached)) {
        set({ data: cached.data, status: 'success' });
        fetchData()
          .then((freshData) => {
            if (isPayloadDifferent(freshData, cached.data)) {
              set({ stale: true });
            }
          })
          .catch(() => set({ stale: true }));
        return;
      }

      const data = await fetchData();
      writeCachedAto(data);
      set({ data, status: 'success', stale: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ status: 'error', error: message });
    }
  },

  refresh: async () => {
    set({ status: 'loading' });
    try {
      const data = await fetchData();
      writeCachedAto(data);
      set({ data, status: 'success', stale: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ status: 'error', error: message });
    }
  },
}));
