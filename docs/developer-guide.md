# Developer guide

## Environment setup

1. Install Node.js 20 (LTS) and npm 10.
2. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

3. Run the development experience (Vite renderer + Electron shell):

   ```bash
   npm run dev
   ```

   - Vite serves the renderer on <http://localhost:5173>.
   - The Electron main process compiles with TypeScript and launches the desktop window once Vite is ready.

## Codebase layout

- **`src/`** — React + TypeScript renderer code organised into:
  - `components/modules/` — feature modules (GST calculator, income tax, business tools).
  - `components/ui/` — shadcn-inspired UI primitives built with Tailwind CSS.
  - `hooks/` — data fetching (e.g. `useAtoRates`) with caching and offline support.
  - `lib/` — pure calculation helpers (`gst`, `incomeTax`, `penalties`).
  - `types/` — shared TypeScript interfaces for rate data.
- **`electron/`** — Electron `main` and `preload` processes compiled with TypeScript into `dist-electron/`.
- **`public/`** — static assets copied verbatim into the Vite build, including cached rate JSON.
- **`data/`** — canonical JSON dataset updated via automation.
- **`scripts/`** — tooling to synchronise rate data, invoked locally or by CI.

## Styling & components

- Tailwind CSS powers all styling. Utility classes are merged via the `cn` helper (`clsx` + `tailwind-merge`).
- UI components emulate the shadcn system but are self-contained in `src/components/ui/`.
- Keep business logic (tax calculations, penalty maths) inside `src/lib/calculations/` to maximise reuse and testability.

## Data fetching & caching

- `useAtoRates` attempts to download the latest JSON from `VITE_ATO_RATES_URL` (or the default GitHub Pages URL).
- Successful responses are cached in `localStorage` for seven days. When offline, cached data keeps the app functional.
- The hook exposes a `refresh` method used by the UI to manually retry downloads.

## Quality checks

Run these commands before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

Automated workflows execute the same checks plus packaging tasks.

## Packaging & releases

- `npm run package` builds the renderer and Electron main process, then invokes `electron-builder` to generate an
  NSIS installer in `release/`.
- Auto-update uses GitHub Releases via `electron-updater`. Provide a `GH_TOKEN` when packaging locally if you want
  to publish a draft release from the CLI.

## Updating tax rates

- Run `npm run update:rates` to download the latest JSON from the configured source and update `data/ato-rates.json`
  as well as `public/data/ato-rates.json`.
- The scheduled GitHub Action (`Sync ATO Rates`) performs the same operation weekly and commits changes to a
  `data/sync` branch using `stefanzweifel/git-auto-commit-action`.
- Extend `scripts/update-ato-rates.ts` with scraping logic or alternate data feeds as required by future roadmap
  phases. The current implementation assumes a normalised JSON feed is available.

## Testing & future enhancements

- Unit tests can be added under `src/__tests__/` using Vitest or Jest. The calculation helpers were designed to be
  deterministic and easily testable.
- Planned roadmap items (Phase 2+) include richer data scraping, BAS lodgement reminders, and cross-platform builds.
