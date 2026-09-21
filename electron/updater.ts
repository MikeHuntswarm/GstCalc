import type { BrowserWindow } from 'electron';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater') as typeof import('electron-updater');

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

export function setupAutoUpdates(mainWindow: BrowserWindow) {
  if (isDev) {
    return;
  }

  // Public repo — no token needed
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'MikeHuntswarm',
    repo: 'GstCalc',
    private: false,
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updater:update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('updater:update-not-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('updater:download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updater:update-downloaded', info);
  });

  autoUpdater.on('error', (error: Error) => {
    mainWindow.webContents.send('updater:error', error);
  });

  autoUpdater.checkForUpdates().catch((error: unknown) => {
    console.error('Failed to check for updates', error);
  });
}

export function relaunchAndInstall() {
  autoUpdater.quitAndInstall(true, true);
}

export function checkForUpdates() {
  autoUpdater.checkForUpdates().catch((error: unknown) => {
    console.error('Failed to check for updates', error);
  });
}
