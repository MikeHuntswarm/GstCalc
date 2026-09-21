import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldOpenExternally } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const appRoot = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

// The preload must be CommonJS (.cjs): Electron does not support ESM preload
// scripts in sandboxed renderers, and this package is "type": "module".
// electron/preload.cts compiles to dist-electron/preload.cjs.
function resolvePreload() {
  return path.join(appRoot, 'preload.cjs');
}

export async function createMainWindow(): Promise<BrowserWindow> {
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
    // Only open http/https links externally; deny everything else
    if (shouldOpenExternally(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent the window from navigating away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (url !== currentUrl && url !== devUrl) {
      event.preventDefault();
      if (shouldOpenExternally(url)) {
        shell.openExternal(url);
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
