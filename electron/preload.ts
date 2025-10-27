import { contextBridge, ipcRenderer } from 'electron';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';

contextBridge.exposeInMainWorld('gstcalc', {
  versions: {
    app: () => process.versions.electron,
    chrome: () => process.versions.chrome,
    node: () => process.versions.node,
  },
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', title, body);
  },
  getAtoRates: (url: string) => ipcRenderer.invoke('get-ato-rates', url),
  updater: {
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('updater:update-available', (event, info) => callback(info));
    },
    onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('updater:update-not-available', (event, info) => callback(info));
    },
    onDownloadProgress: (callback: (progress: ProgressInfo) => void) => {
      ipcRenderer.on('updater:download-progress', (event, progress) => callback(progress));
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('updater:update-downloaded', (event, info) => callback(info));
    },
    onError: (callback: (error: Error) => void) => {
      ipcRenderer.on('updater:error', (event, error) => callback(error));
    },
  },
  app: {
    relaunch: () => ipcRenderer.send('app:relaunch'),
  },
  checkForUpdates: () => ipcRenderer.send('updater:check-for-updates'),
});
