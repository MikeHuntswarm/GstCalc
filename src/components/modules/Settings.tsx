import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  InfoIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useThemeStore, type Theme } from '@/store/theme';
import { logger } from '@/lib/logger';
import { exportData, importData, clearAllData, getStorageInfo, formatBytes } from '@/lib/backup';

export function Settings() {
  const { theme, setTheme } = useThemeStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve the real packaged app version from the Electron bridge when available.
  const [appVersion, setAppVersion] = useState<string>(
    import.meta.env['VITE_APP_VERSION'] ?? '0.1.20',
  );
  const [electronVersion, setElectronVersion] = useState<string>('');

  useEffect(() => {
    const api = window.gstcalc;
    if (api?.versions?.app) {
      api.versions
        .app()
        .then((v) => v && setAppVersion(v))
        .catch(() => {
          /* keep the build-time fallback */
        });
    }
    if (api?.versions?.chrome) {
      setElectronVersion(api.versions.chrome());
    }
  }, []);

  const storageInfo = getStorageInfo();
  const debugMode = logger.isDebugMode();

  const handleExport = () => {
    exportData();
  };

  const handleImport = async () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importData(file);
      // Clear the input so the same file can be selected again
      event.target.value = '';
    } catch {
      // Error is already handled in importData
    }
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      clearAllData();
      setShowClearConfirm(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 5000);
    }
  };

  const handleToggleDebug = () => {
    if (debugMode) {
      logger.disableDebug();
      toast.success('Debug mode disabled');
    } else {
      logger.enableDebug();
      toast.success('Debug mode enabled');
    }
    // Force re-render
    window.location.reload();
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <SunIcon className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <MonitorIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Theme</Label>
            <div className="mt-2 flex gap-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(option.value)}
                  className="gap-2"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup, restore, or clear your application data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-base">Export Data</Label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Download all your data including reminders, saved scenarios, and settings
                </p>
              </div>
              <Button onClick={handleExport} className="gap-2">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-base">Import Data</Label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Restore data from a previous backup file
                </p>
              </div>
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={handleImport} variant="outline" className="gap-2">
                  <UploadIcon className="h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-base">Clear All Data</Label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Remove all stored data from the application
                </p>
              </div>
              <Button
                onClick={handleClearData}
                variant={showClearConfirm ? 'destructive' : 'outline'}
                className="gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                {showClearConfirm ? 'Confirm Clear' : 'Clear Data'}
              </Button>
            </div>

            {showClearConfirm && (
              <Alert variant="warning">
                <InfoIcon className="h-4 w-4" />
                <p className="text-sm">
                  Click &quot;Confirm Clear&quot; again to permanently delete all data. This cannot
                  be undone.
                </p>
              </Alert>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <Label className="text-sm font-semibold">Storage Usage</Label>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Size</span>
                <Badge variant="outline">{formatBytes(storageInfo.total)}</Badge>
              </div>
              {storageInfo.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{item.key}</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {formatBytes(item.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer</CardTitle>
          <CardDescription>Advanced settings for debugging and development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label className="text-base">Debug Mode</Label>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Enable detailed console logging for troubleshooting
              </p>
            </div>
            <Button
              onClick={handleToggleDebug}
              variant={debugMode ? 'default' : 'outline'}
              size="sm"
            >
              {debugMode ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {debugMode && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <p className="text-sm">
                Debug mode is active. Check the browser console for detailed logs.
              </p>
            </Alert>
          )}

          <Separator />

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs dark:border-blue-800 dark:bg-blue-900/20">
            <p className="font-semibold text-blue-900 dark:text-blue-300">
              Application Information
            </p>
            <ul className="mt-2 space-y-1 text-blue-800 dark:text-blue-400">
              <li>• Version: {appVersion}</li>
              <li>• Environment: {import.meta.env.DEV ? 'Development' : 'Production'}</li>
              {window.gstcalc && (
                <>
                  <li>• Electron: {electronVersion}</li>
                  <li>• Chrome: {window.gstcalc.versions.chrome()}</li>
                  <li>• Node: {window.gstcalc.versions.node()}</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
