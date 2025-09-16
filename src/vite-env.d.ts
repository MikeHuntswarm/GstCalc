/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ATO_RATES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
