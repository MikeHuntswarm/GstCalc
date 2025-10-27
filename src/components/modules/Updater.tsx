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

  useEffect(() => {
    window.gstcalc.updater.onUpdateAvailable((info) => {
      setUpdateAvailable(info);
      setIsChecking(false);
    });

    window.gstcalc.updater.onUpdateNotAvailable(() => {
      setUpdateAvailable(null);
      setIsChecking(false);
    });

    window.gstcalc.updater.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
    });

    window.gstcalc.updater.onUpdateDownloaded((info) => {
      setUpdateDownloaded(info);
    });

    window.gstcalc.updater.onError((err) => {
      setError(err);
      setIsChecking(false);
    });
  }, []);

  const handleCheckForUpdates = () => {
    setIsChecking(true);
    setError(null);
    setUpdateAvailable(null);
    setDownloadProgress(null);
    setUpdateDownloaded(null);
    window.gstcalc.checkForUpdates();
  };

  const handleRelaunch = () => {
    window.gstcalc.app.relaunch();
  };

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
          <p>You are on the latest version.</p>
        )}
      </CardContent>
    </Card>
  );
}
