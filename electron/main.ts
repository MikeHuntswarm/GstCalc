import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window.js';
import { setupAutoUpdates } from './updater.js';
import { registerIpcHandlers } from './ipc.js';

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(async () => {
  const mainWindow = await createMainWindow();
  setupAutoUpdates(mainWindow);
  registerIpcHandlers();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});
