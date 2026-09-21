import { ipcMain, Notification } from 'electron';
import { relaunchAndInstall, checkForUpdates } from './updater.js';

const NOTIFICATION_COOLDOWN = 1000; // 1 second

export function registerIpcHandlers() {
  // Rate limiting for notifications
  let lastNotificationTime = 0;

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
    relaunchAndInstall();
  });

  ipcMain.on('updater:check-for-updates', () => {
    checkForUpdates();
  });
}
