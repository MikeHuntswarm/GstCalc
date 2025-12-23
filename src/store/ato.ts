import { create } from 'zustand';
import type { AtoData } from '@/types/ato';
import { AtoDataSchema } from '@/types/ato.schema';
import { STORAGE_KEYS, CACHE_EXPIRY_MS } from '@/lib/constants';

interface AtoState {
  data: AtoData | null;
  status: 'loading' | 'success' | 'error';
  error: string | null;
  stale: boolean;
  fetchAtoRates: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Use relative paths to improve compatibility in different contexts
// - './data/ato-rates.json' works better in dev server
// - './public/data/ato-rates.json' is a fallback for Electron
const LOCAL_API_URL = './data/ato-rates.json';
const ELECTRON_API_URL = './public/data/ato-rates.json';
const CACHE_KEY = STORAGE_KEYS.ATO_RATES;

async function fetchData(): Promise<AtoData> {
  // Try multiple approaches to load the data, in order of preference
  const errors: Error[] = [];

  // 1. First try using Electron's IPC if available (production app)
  if (window.gstcalc?.getAtoRates) {
    try {
      console.log('Trying to load ATO rates via Electron IPC');
      const rawData = await window.gstcalc.getAtoRates(ELECTRON_API_URL);

      // Validate the data against schema
      const data = AtoDataSchema.parse(rawData);

      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      console.log('Successfully loaded ATO rates via Electron IPC');
      return data;
    } catch (electronError) {
      console.warn('Failed to load via Electron IPC, will try fetch API', electronError);
      errors.push(
        electronError instanceof Error ? electronError : new Error('Unknown Electron error'),
      );
    }
  }

  // 2. Try using the fetch API (works in browser and dev mode)
  try {
    console.log('Trying to load ATO rates via fetch API from', LOCAL_API_URL);
    const response = await fetch(LOCAL_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch ATO rates: ${response.statusText}`);
    }
    const rawData = await response.json();

    // Validate the data against schema
    const data = AtoDataSchema.parse(rawData);

    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    console.log('Successfully loaded ATO rates via fetch API');
    return data;
  } catch (fetchError) {
    console.warn('Failed to load via fetch API', fetchError);
    errors.push(fetchError instanceof Error ? fetchError : new Error('Unknown fetch error'));
  }

  // If we got here, all attempts failed
  const errorMessage = `Failed to load ATO rates data: ${errors.map((e) => e.message).join('; ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const useAtoStore = create<AtoState>((set, _get) => ({
  data: null,
  status: 'loading',
  error: null,
  stale: false,
  fetchAtoRates: async () => {
    set({ status: 'loading' });
    try {
      // Try to load from cache with validation
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const { timestamp, data } = parsed;

          // Validate cached data
          const validatedData = AtoDataSchema.parse(data);

          if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
            set({ data: validatedData, status: 'success' });
            // Still fetch in background to check for staleness
            fetchData()
              .then((freshData) => {
                if (JSON.stringify(freshData) !== JSON.stringify(validatedData)) {
                  set({ stale: true });
                }
              })
              .catch(() => set({ stale: true }));
            return;
          }
        }
      } catch (cacheError) {
        // Cache is corrupt or invalid, clear it
        console.warn('Cache validation failed, clearing:', cacheError);
        localStorage.removeItem(CACHE_KEY);
      }

      const data = await fetchData();
      set({ data, status: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ status: 'error', error: message });
    }
  },
  refresh: async () => {
    set({ status: 'loading' });
    try {
      const data = await fetchData();
      set({ data, status: 'success', stale: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ status: 'error', error: message });
    }
  },
}));
