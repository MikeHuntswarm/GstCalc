import { create } from 'zustand';
import type { AtoData } from '@/types/ato';

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
const CACHE_KEY = 'gstcalc-ato-rates';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function fetchData(): Promise<AtoData> {
  // Try multiple approaches to load the data, in order of preference
  const errors: Error[] = [];

  // 1. First try using Electron's IPC if available (production app)
  if (window.gstcalc?.getAtoRates) {
    try {
      console.log('Trying to load ATO rates via Electron IPC');
      const data = await window.gstcalc.getAtoRates(ELECTRON_API_URL);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data }),
      );
      console.log('Successfully loaded ATO rates via Electron IPC');
      return data;
    } catch (electronError) {
      console.warn('Failed to load via Electron IPC, will try fetch API', electronError);
      errors.push(electronError instanceof Error ? electronError : new Error('Unknown Electron error'));
    }
  }

  // 2. Try using the fetch API (works in browser and dev mode)
  try {
    console.log('Trying to load ATO rates via fetch API from', LOCAL_API_URL);
    const response = await fetch(LOCAL_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch ATO rates: ${response.statusText}`);
    }
    const data = await response.json();
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
    console.log('Successfully loaded ATO rates via fetch API');
    return data;
  } catch (fetchError) {
    console.warn('Failed to load via fetch API', fetchError);
    errors.push(fetchError instanceof Error ? fetchError : new Error('Unknown fetch error'));
  }
  
  // If we got here, all attempts failed
  const errorMessage = `Failed to load ATO rates data: ${errors.map(e => e.message).join('; ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const useAtoStore = create<AtoState>((set, get) => ({
  data: null,
  status: 'loading',
  error: null,
  stale: false,
  fetchAtoRates: async () => {
    set({ status: 'loading' });
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          set({ data, status: 'success' });
          // Still fetch in background to check for staleness
          fetchData()
            .then((freshData) => {
              if (JSON.stringify(freshData) !== JSON.stringify(data)) {
                set({ stale: true });
              }
            })
            .catch(() => set({ stale: true }));
          return;
        }
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
