import { useState, useEffect } from 'react';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function Updater() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ProgressInfo | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const hasElectronApi =
    typeof window !== 'undefined' && typeof window.gstcalc !== 'undefined';

  useEffect(() => {
    const api = window.gstcalc;
    if (!api || !api.updater) {
      return;
    }

    const { updater } = api;

    updater.onUpdateAvailable((info) => {
      setUpdateAvailable(info);
      setIsChecking(false);
      setLastCheckedAt(new Date());
    });

    updater.onUpdateNotAvailable(() => {
      setUpdateAvailable(null);
      setIsChecking(false);
      setLastCheckedAt(new Date());
    });

    updater.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
    });

    updater.onUpdateDownloaded((info) => {
      setUpdateDownloaded(info);
    });

    updater.onError((err) => {
      setError(err);
      setIsChecking(false);
      setLastCheckedAt(new Date());
    });
  }, []);

  const handleCheckForUpdates = () => {
    const api = window.gstcalc;
    if (!api) {
      return;
    }

    setIsChecking(true);
    setError(null);
    setUpdateAvailable(null);
    setDownloadProgress(null);
    setUpdateDownloaded(null);
    api.checkForUpdates();
  };

  const handleRelaunch = () => {
    const api = window.gstcalc;
    if (!api) {
      return;
    }

    api.app.relaunch();
  };

  if (!hasElectronApi) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Updater</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Updates are managed by the packaged desktop application. Run the installer build of
            GSTCalc to receive automatic updates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Updater</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="check-for-updates">Check for new updates</Label>
          <Button id="check-for-updates" onClick={handleCheckForUpdates} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </Button>
        </div>
        <Separator />
        {error && (
          <div className="text-red-500">
            <p>Error: {error.message}</p>
          </div>
        )}
        {updateAvailable && !updateDownloaded && (
          <div>
            <p>
              A new version ({updateAvailable.version}) is available. Downloading...
            </p>
            {downloadProgress && (
              <div>
                <p>Progress: {Math.round(downloadProgress.percent)}%</p>
                <p>
                  ({Math.round(downloadProgress.bytesPerSecond / 1024)} KB/s)
                </p>
              </div>
            )}
          </div>
        )}
        {updateDownloaded && (
          <div className="flex items-center justify-between">
            <p>Update downloaded. Version: {updateDownloaded.version}</p>
            <Button onClick={handleRelaunch}>Restart and Install</Button>
          </div>
        )}
        {!updateAvailable && !isChecking && !error && (
          <div className="space-y-1 text-sm text-slate-700">
            <p>
              {lastCheckedAt
                ? 'No newer version was found.'
                : 'Click “Check for Updates” to see if a newer version is available.'}
            </p>
            {lastCheckedAt && (
              <p className="text-xs text-slate-500">
                Last checked: {lastCheckedAt.toLocaleString('en-AU')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
