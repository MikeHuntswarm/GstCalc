import type { AtoData } from './ato';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';

/**
 * Global type definitions for the GSTCalc application
 */

declare global {
  interface Window {
    /**
     * Electron IPC bridge exposed via preload script
     */
    gstcalc?: {
      /**
       * Version information
       */
      versions: {
        app: () => string;
        chrome: () => string;
        node: () => string;
      };

      /**
       * Send a desktop notification
       */
      sendNotification: (title: string, body: string) => void;

      /**
       * Auto-updater event handlers
       */
      updater: {
        onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
        onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => () => void;
        onDownloadProgress: (callback: (progress: ProgressInfo) => void) => () => void;
        onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void;
        onError: (callback: (error: Error) => void) => () => void;
      };

      /**
       * App control methods
       */
      app: {
        relaunch: () => void;
      };

      /**
       * Check for updates manually
       */
      checkForUpdates: () => void;
    };

    /**
     * Logger instance (exposed for debugging)
     */
    logger?: {
      debug: (message: string, ...args: unknown[]) => void;
      info: (message: string, ...args: unknown[]) => void;
      warn: (message: string, ...args: unknown[]) => void;
      error: (message: string, ...args: unknown[]) => void;
      getLogs: (count?: number) => unknown[];
      clearLogs: () => void;
      enableDebug: () => void;
      disableDebug: () => void;
      isDebugMode: () => boolean;
    };
  }
}

export {};
