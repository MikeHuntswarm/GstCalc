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

const API_URL = '/data/ato-rates.json';
const CACHE_KEY = 'gstcalc-ato-rates';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function fetchData(): Promise<AtoData> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ATO rates: ${response.statusText}`);
  }
  const data = await response.json();
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ timestamp: Date.now(), data }),
  );
  return data;
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
