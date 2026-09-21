/// <reference types="vite/client" />
/// <reference types="vitest" />

interface ImportMetaEnv {
  readonly VITE_ATO_RATES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
