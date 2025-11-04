/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ATO_RATES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron preload API
import type { UpdateInfo, ProgressInfo } from 'electron-updater';

interface ElectronVersions {
  app: () => string;
  chrome: () => string;
  node: () => string;
}

interface ElectronUpdater {
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => void;
  onDownloadProgress: (callback: (progress: ProgressInfo) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  onError: (callback: (error: Error) => void) => void;
}

interface ElectronApp {
  relaunch: () => void;
}

interface ElectronAPI {
  versions: ElectronVersions;
  sendNotification: (title: string, body: string) => void;
  getAtoRates: (url: string) => Promise<any>;
  updater: ElectronUpdater;
  app: ElectronApp;
}

declare global {
  interface Window {
    gstcalc?: ElectronAPI;
  }
}
