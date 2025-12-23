/**
 * Data backup and restore utilities
 */

import { toast } from 'sonner';
import { STORAGE_KEYS } from './constants';
import { logger } from './logger';
import { StorageError } from './errors';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    reminders?: string;
    gstScenarios?: string;
    incomeScenarios?: string;
    theme?: string;
    settings?: string;
    lodgementHistory?: string;
  };
}

/**
 * Export all app data to a JSON file
 */
export function exportData(): void {
  try {
    const backup: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {},
    };

    // Collect all localStorage data
    for (const [key, value] of Object.entries(STORAGE_KEYS)) {
      const data = localStorage.getItem(value);
      if (data) {
        backup.data[key.toLowerCase() as keyof BackupData['data']] = data;
      }
    }

    // Create blob and download
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gstcalc-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info('Data exported successfully');
    toast.success('Backup created successfully!');
  } catch (error) {
    logger.error('Failed to export data', error);
    toast.error('Failed to create backup');
    throw new StorageError('Failed to export data', error);
  }
}

/**
 * Import app data from a JSON file
 */
export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backup: BackupData = JSON.parse(content);

        // Validate backup format
        if (!backup.version || !backup.timestamp || !backup.data) {
          throw new Error('Invalid backup file format');
        }

        // Restore data to localStorage
        let restoredCount = 0;
        for (const [key, value] of Object.entries(backup.data)) {
          if (value) {
            const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
            if (storageKey) {
              localStorage.setItem(storageKey, value);
              restoredCount++;
            }
          }
        }

        logger.info(`Data imported successfully. Restored ${restoredCount} items`);
        toast.success('Backup restored successfully! Please refresh the page.');
        resolve();
      } catch (error) {
        logger.error('Failed to import data', error);
        toast.error('Failed to restore backup. Invalid file format.');
        reject(new StorageError('Failed to import data', error));
      }
    };

    reader.onerror = () => {
      const error = new StorageError('Failed to read backup file');
      logger.error('Failed to read file', error);
      toast.error('Failed to read backup file');
      reject(error);
    };

    reader.readAsText(file);
  });
}

/**
 * Clear all app data from localStorage
 */
export function clearAllData(): void {
  try {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach((key) => localStorage.removeItem(key));

    logger.info('All data cleared');
    toast.success('All data cleared successfully');
  } catch (error) {
    logger.error('Failed to clear data', error);
    toast.error('Failed to clear data');
    throw new StorageError('Failed to clear data', error);
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  items: { key: string; size: number }[];
  total: number;
} {
  const items: { key: string; size: number }[] = [];
  let total = 0;

  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      items.push({ key: name, size });
      total += size;
    }
  }

  return { items, total };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
