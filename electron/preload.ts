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
  updater: {
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      const handler = (event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info);
      ipcRenderer.on('updater:update-available', handler);
      return () => ipcRenderer.removeListener('updater:update-available', handler);
    },
    onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => {
      const handler = (event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info);
      ipcRenderer.on('updater:update-not-available', handler);
      return () => ipcRenderer.removeListener('updater:update-not-available', handler);
    },
    onDownloadProgress: (callback: (progress: ProgressInfo) => void) => {
      const handler = (event: Electron.IpcRendererEvent, progress: ProgressInfo) =>
        callback(progress);
      ipcRenderer.on('updater:download-progress', handler);
      return () => ipcRenderer.removeListener('updater:download-progress', handler);
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
      const handler = (event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info);
      ipcRenderer.on('updater:update-downloaded', handler);
      return () => ipcRenderer.removeListener('updater:update-downloaded', handler);
    },
    onError: (callback: (error: Error) => void) => {
      const handler = (event: Electron.IpcRendererEvent, error: Error) => callback(error);
      ipcRenderer.on('updater:error', handler);
      return () => ipcRenderer.removeListener('updater:error', handler);
    },
  },
  app: {
    relaunch: () => ipcRenderer.send('app:relaunch'),
  },
  checkForUpdates: () => ipcRenderer.send('updater:check-for-updates'),
});
