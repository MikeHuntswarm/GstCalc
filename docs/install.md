# Installation guide (Windows)

1. Download the latest `GSTCalc Setup.exe` from the GitHub Releases page. Releases are generated automatically when
   a new `v*` tag is pushed.
2. Double-click the installer and follow the NSIS prompts. The default install location is under
   `%LocalAppData%\\Programs\\GSTCalc`.
3. Launch **GSTCalc** from the Start menu or desktop shortcut.

## Auto updates

- The app checks for updates on startup via `electron-updater`.
- When a new version is available the installer is downloaded in the background and the user is prompted to restart.
- Updates are delivered from GitHub Releases. Ensure network policies allow access to `github.com` and
  `githubusercontent.com` domains.

## Offline mode

- The first successful launch downloads the latest rate JSON and caches it locally.
- If you open the app without internet access, GSTCalc falls back to the cached data (up to seven days old) and
  highlights that the dataset may be stale.

## Uninstallation

- Use **Add or remove programs** in Windows Settings and remove “GSTCalc”.
- Alternatively, re-run the installer and choose *Uninstall*.
