# GSTCalc — Australian Tax & GST Desktop Toolkit

GSTCalc is a cross-platform (Windows-focused) desktop application built with Electron and React. It helps
individuals and businesses in Australia calculate GST, estimate PAYG income tax, monitor company tax
obligations, and understand the penalties that can apply when lodgements are late.

## Key capabilities

- **GST calculator** — switch between ex-GST and inc-GST modes, adjust rates, copy results, and use quick-entry
  buttons for common values.
- **Income tax estimator** — fetches the latest ATO tax brackets and calculates PAYG withholding for annual or
  weekly incomes across multiple financial years.
- **Business toolbox** — highlights the company tax rate that applies, provides a simplified BAS GST helper,
  and surfaces penalty exposure (Failure to Lodge and General Interest Charge).
- **Live data updates** — scheduled GitHub Actions keep the rate JSON synchronised with ATO sources. The app
  fetches fresh data on launch and falls back to cached copies when offline.
- **Electron packaging** — ships as a Windows x64 installer via `electron-builder` with auto-update support.

## Getting started

> **Prerequisites:** Node.js 20+, npm 10+, and Git.

```bash
npm install
npm run dev
```

The development command launches Vite and the Electron shell together. The renderer is available at
<http://localhost:5173> for hot-module reloading.

### Useful npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run Vite + Electron in development with hot reload. |
| `npm run build` | Build the renderer (Vite) and Electron main process. |
| `npm run package` | Build production bundles and create a Windows installer via electron-builder. |
| `npm run lint` | Lint the project with ESLint (TypeScript + React rules). |
| `npm run typecheck` | Run TypeScript type checking without emitting files. |
| `npm run update:rates` | Fetch the latest ATO rates JSON and sync to `data/` + `public/`. |

## Project structure

```
├── electron/              # Electron main process & preload scripts
├── src/                   # React + TypeScript renderer code
│   ├── components/        # UI modules and shadcn-inspired primitives
│   ├── hooks/             # Data fetching and caching logic
│   ├── lib/               # Calculation helpers
│   └── types/             # Shared TypeScript interfaces
├── data/ato-rates.json    # Canonical rate + penalty dataset (synced via Actions)
├── public/data/           # Static JSON served by the renderer (for offline cache)
├── scripts/               # Tooling scripts (ATO rate synchronisation)
└── .github/workflows/     # Build/release and data-sync automation
```

## Automation & data pipeline

- `.github/workflows/update-rates.yml` runs weekly (and on demand) to download the latest rate JSON
  from the configured source, write it to `data/ato-rates.json`, and open an automated PR when
  changes are detected.
- `.github/workflows/build.yml` packages the Electron application for Windows whenever a `v*`
  tag is pushed or the workflow is triggered manually. The build uploads the generated installer as
  an artifact.
- `scripts/update-ato-rates.ts` can be executed locally or in CI to refresh the JSON dataset. Override
  the source URL with the `ATO_RATES_SOURCE` environment variable to point at staging or scraped outputs.

## Desktop packaging & auto-update

Electron Builder is configured to generate an NSIS installer. Auto updates are powered by
`electron-updater` and GitHub Releases. Set the `GH_TOKEN` environment variable (provided automatically in
Actions) when running `npm run package` to publish draft releases and enable differential updates.

## Documentation

- [Developer guide](docs/developer-guide.md)
- [Installation guide](docs/install.md)
- [Legal disclaimer](docs/legal.md)
- [Penalty reference](docs/penalties.md)

## Contributing & support

Pull requests and issues are welcome. Please file bugs with reproduction steps and include any relevant
ATO references so the calculations can be verified.

> **Disclaimer:** GSTCalc is an educational tool and not financial advice. Always verify results against the
> Australian Taxation Office or with a registered tax professional.
