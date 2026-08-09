import { app, BrowserWindow, shell, ipcMain, Notification } from 'electron';
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
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Only open http/https links externally; deny everything else (file:, javascript:, etc.)
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch {
      // Invalid URL - deny
    }
    return { action: 'deny' };
  });

  // Prevent the window from navigating away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (url !== currentUrl && url !== devUrl) {
      event.preventDefault();
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          shell.openExternal(url);
        }
      } catch {
        // Invalid URL - just prevent navigation
      }
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(appRoot, '../dist/index.html'));
  }

  return mainWindow;
}

function setupAutoUpdates(mainWindow: BrowserWindow) {
  if (isDev) {
    return;
  }

  // Configure autoUpdater for private repository
  const ghToken = process.env.GH_TOKEN;
  if (ghToken) {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'MikeHuntswarm',
      repo: 'GstCalc',
      private: false,
      token: ghToken,
    });
  } else {
    console.warn('GH_TOKEN not found. Auto-updates may not work for private repository.');
  }

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(async () => {
  const mainWindow = await createMainWindow();
  setupAutoUpdates(mainWindow);

  // Rate limiting for notifications
  let lastNotificationTime = 0;
  const NOTIFICATION_COOLDOWN = 1000; // 1 second

  ipcMain.on('show-notification', (event, title, body) => {
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
      console.log('Notification rate limited');
      return;
    }
    lastNotificationTime = now;

    console.log(`Showing notification: ${title} - ${body}`);
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    } else {
      console.log('Notifications are not supported on this system.');
    }
  });

  ipcMain.on('app:relaunch', () => {
    autoUpdater.quitAndInstall(true, true);
  });

  ipcMain.on('updater:check-for-updates', () => {
    autoUpdater.checkForUpdates().catch((error: unknown) => {
      console.error('Failed to check for updates', error);
    });
  });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});
