import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('gstcalc', {
  versions: {
    app: () => process.versions.electron,
    chrome: () => process.versions.chrome,
    node: () => process.versions.node,
  },
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', title, body);
  },
});
