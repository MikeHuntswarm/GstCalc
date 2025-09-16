import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('gstcalc', {
  versions: {
    app: () => process.versions.electron,
    chrome: () => process.versions.chrome,
    node: () => process.versions.node
  }
});
