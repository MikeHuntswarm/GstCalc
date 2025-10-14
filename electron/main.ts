import { app, BrowserWindow, shell, ipcMain, Notification, net } from 'electron';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater') as typeof import('electron-updater');

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

const __filename = fileURLToPath(import.meta.url);
const appRoot = path.dirname(__filename);

function resolvePreload() {
  return path.join(appRoot, 'preload.js');
}

async function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      preload: resolvePreload(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(appRoot, '../dist/index.html'));
  }

  return mainWindow;
}

function setupAutoUpdates() {
  if (isDev) {
    return;
  }

  autoUpdater.on('error', (error: Error) => {
    console.error('Auto update error:', error);
  });

  autoUpdater.checkForUpdatesAndNotify().catch((error: unknown) => {
    console.error('Failed to check for updates', error);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(async () => {
  await createMainWindow();
  setupAutoUpdates();

  ipcMain.on('show-notification', (event, title, body) => {
    console.log(`Showing notification: ${title} - ${body}`);
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    } else {
      console.log('Notifications are not supported on this system.');
    }
  });

  ipcMain.handle('get-ato-rates', async (event, url) => {
    try {
      const response = await net.fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch ATO rates:', error);
      throw error;
    }
  });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});
