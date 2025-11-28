# Support & troubleshooting

This page collects common issues and answers for GSTCalc. It is intended as a practical companion to the main README and legal disclaimer.

## Troubleshooting

### ATO rates failed to load

If the app reports that ATO rates could not be loaded or that only cached data is available:

- Check that you have an active internet connection.
- Ensure your firewall or proxy allows access to `github.com` and `githubusercontent.com`.
- If you are running from source, run:
  - `npm run update:rates`
  - Confirm that `data/ato-rates.json` and `public/data/ato-rates.json` exist and contain JSON.
- If the problem persists in a packaged build, try restarting the app and your network connection.

### App shows cached or stale data

GSTCalc keeps a copy of the last successful ATO dataset in local storage for **up to 7 days**. If you start the app while offline or if the live download fails, the app will:

- Load the cached copy (if present), and
- Show a warning that the rates may be stale.

To force a refresh once you are back online, use the **Refresh rates** button in the header.

### Updates do not appear

The packaged desktop app uses `electron-updater` and GitHub Releases.

- Ensure your network allows access to GitHub.
- From the **App Updates** tab, click **Check for Updates** to force a manual check.
- If no updates are found but you believe a newer version exists, confirm that you are running the latest installer from the project’s Releases page.

### Catch-up planner

The **Catch-up planner** helps you track missed BAS quarters and annual company tax amounts.

- Your entries (type, quarter, year, amount, notes and due date) are saved locally in the app’s storage so they are there next time you open GSTCalc on the same machine.
- You can clear the planner by removing the `gstcalc_missed_lodgements_v2` key from application storage or by uninstalling the app.
- Penalty amounts shown on this page are estimates based only on the current Failure to Lodge settings and **do not** include General Interest Charge (GIC) or any payment arrangements.
- Use the planner as a cash-flow aid and confirm actual amounts with the ATO or your tax agent before paying.

## Privacy & data handling

GSTCalc is designed as a local desktop tool:

- Amounts you enter (income, GST, penalties, reminders) are processed **locally on your machine**.
- The app does **not** send your financial inputs to any remote server.
- The only network calls the app makes are to fetch:
  - ATO rate JSON (from the configured source), and
  - Application updates from GitHub Releases (in packaged builds).

Reminder data is stored locally in your browser/Electron storage so it persists between sessions. You can clear all reminders at any time by removing the `gstcalc-reminders` entry from your application storage or by uninstalling the app.

## When to seek professional advice

GSTCalc is an educational tool and a convenience calculator. It does **not** replace guidance from the Australian Taxation Office or a registered tax agent. Always:

- Confirm important amounts against official ATO calculators and tables.
- Seek professional advice before making significant tax or business decisions.
