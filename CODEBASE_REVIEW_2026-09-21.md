# GstCalc — Codebase Review

**Date:** 2026-09-21 · **Version reviewed:** v0.1.20 (commit `88d0e1e`) · **Branch:** main
**Previous review:** `CODEBASE_REVIEW_2026-07-09.md` (outdated — superseded)

---

## 1. Identity & History

| Item            | Value                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Project         | GSTCalc — Australian GST/tax desktop calculator (Electron + React)                                                                         |
| Version         | 0.1.20                                                                                                                                     |
| Repo            | github.com/MikeHuntswarm/GstCalc                                                                                                           |
| Author          | MikeHuntswarm (solo)                                                                                                                       |
| Age             | ~1 year (first commit Sep 2025, active through Sep 2026)                                                                                   |
| Release cadence | Version bumps every few weeks; latest `v0.1.20` tag                                                                                        |
| Recent focus    | Modular splits (BusinessTools → per-feature, LodgementHistory, reminders store), ATO 2026-27 data, security hardening, Electron main-split |

Recent commits (last 15): refactor-heavy — extract `atoCache`, `dueDates`, reminders store, lodgement components, security policy; plus data updates and CI fixes.

---

## 2. What It Is

A desktop-only tax toolkit for Australian individuals and small businesses: GST calculation, income tax estimation (with Medicare levy), super, franking credits, company tax, BAS/company/income-tax **lodgement tracking** (history, catch-up planner, reminders with native notifications), penalty Estimation (FTL + GIC), and tax-reduction strategies. Reference rates ship as a bundled JSON (ATO-derived, fetch-cached to localStorage with a 7-day staleness policy). Desktop app only — no server component; Electron auto-updates via GitHub releases.

---

## 3. Tech Stack

| Technology                                    | Role                                                             |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Electron 38.8.6 + electron-builder 26         | Desktop shell, NSIS installer, GitHub auto-update                |
| React 19 + Vite 7                             | Renderer                                                         |
| TypeScript 5.9 (strict)                       | Entire codebase                                                  |
| Zustand 5 + persist                           | State (ATO data, lodgements, reminders, theme)                   |
| Zod 4                                         | Runtime validation (ATO payload, lodgement records, rehydration) |
| Tailwind 3 + Radix UI (tabs, select) + lucide | UI                                                               |
| date-fns, sonner, cva/clsx/tailwind-merge     | Dates, toasts, styling utils                                     |
| Vitest 3 + Testing Library                    | 17 test files / 162 tests                                        |
| Husky + lint-staged + ESLint 9 + Prettier     | Pre-commit hygiene                                               |
| GitHub Actions                                | `build.yml`: lint + typecheck + electron-builder on `v*` tags    |

---

## 4. Codebase Metrics

| Metric              | Value                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Source LOC (ts/tsx) | ~11,850 across `src/` + `electron/` + `__tests__/`                                                          |
| Source files        | ~85 (66 under `src/`, 7 electron, 16 test files)                                                            |
| Tests               | 162 passing (17 files) — **all green**, incl. electron security, tax math, lodgement store                  |
| Largest components  | Reminders.tsx (618 ln), LodgementHistory.tsx (536), MissedLodgements.tsx (458), AnnualBusinessTax.tsx (436) |
| Backing store       | localStorage only (no DB, no server) — fully offline-capable                                                |

---

## 5. Architecture

```
┌─────────────────────────── Electron main (dist-electron/) ───────────────────────────┐
│ main.ts → window.ts (BrowserWindow: sandbox ✓, contextIsolation ✓, nodeIntegration ✗) │
│          → updater.ts (autoUpdater, GitHub feed)                                     │
│          → ipc.ts (notifications w/ 1s cooldown, relaunch, check-for-updates)        │
│          → security.ts (pure URL allow-list for external opens)                      │
└───────────────▲──────────────────────────────────────────────┬──────────────────────┘
      preload.ts (contextBridge 'gstcalc': updater events,       │ ipc
      versions, notifications — narrow, no raw ipc leak)         ▼
┌───────────────┴──────────────────────────── React renderer (src/) ──────────────────┐
│ App.tsx (tabs: Overview, Individual, Business, Lodgement, Catch-up, Annual, Reminders,│
│          Settings, App Updates; ErrorBoundary per tab; Ctrl+1-9 / Ctrl+Shift+R)      │
│ stores/ zustand+persist: ato (fetch+cache), lodgementHistory (CRUD+validation),      │
│      reminders, theme                                                               │
│ lib/ pure: calculations (gst, incomeTax, penalties, atoInvestigationRisk, dueDates),│
│      atoCache (policy), lodgementImport/Export, reminderDates, backup, logger        │
│ data/: ato-rates.json (single source, also copied to public/data/)                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Patterns:** deep modular split (post-Jul refactor) — pure libs extracted and unit-tested; single source of truth for lodgement due dates (`lib/calculations/dueDates.ts`, reconciles the historical copy-paste divergence incl. the 31-Jan company-tax fix); schema validation on every persistence boundary; narrow contextBridge API. Architecture is **appropriate for the domain and well-structured**.

---

## 6. Feature Modules

| Module              | Chain                                                                                                                                     | Notes                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| GST Calculator      | GstCalculator.tsx + calculations/gst.ts                                                                                                   | Tested (incl. exclude/include)            |
| Income Tax          | IncomeTaxCalculator + calculations/incomeTax.ts + Medicare                                                                                | Tested; per-FY brackets                   |
| Super               | SuperCalculator (324 ln)                                                                                                                  | Uses constants fallback super 12%         |
| Franking Credits    | FrankingCredits.tsx (308 ln)                                                                                                              |                                           |
| Business Tools      | BusinessTools → business/{BasSchedule, CompanyTaxReference, InterestBenchmarks, PenaltyAwareness, SmallBusinessConcessions, GstBasHelper} | Good split; 3 have tests                  |
| Annual Business Tax | AnnualBusinessTax.tsx (436 ln, + test)                                                                                                    |                                           |
| Lodgement History   | LodgementHistory (536 ln) + Filter/Form/Sub-components + lodgement store                                                                  | Store thoroughly tested                   |
| Catch-up Planner    | MissedLodgements (458 ln)                                                                                                                 |                                           |
| Reminders           | Reminders.tsx (618 ln — **largest file**) + reminderDates lib + native notification via IPC                                               |                                           |
| Overview            | OverviewDashboard                                                                                                                         |                                           |
| Updater             | Updater.tsx + electron/updater.ts + preload                                                                                               | **display fallback bug — see Findings**   |
| Settings            | Settings.tsx                                                                                                                              | **stale version fallback — see Findings** |

---

## 7. Data & ATO Reference Surface

- Single JSON `data/ato-rates.json` (11 KB), mirrored to `public/data/` (both tracked, currently byte-identical).
- **Verified against ATO sources (Jul 2026 baseline):** FY2026-27 brackets ✔ (0/15/30/37/45, base 4020/31020/51370), Medicare single threshold $28,011 ✔, family $47,253 ✔, penalty unit $364 ✔, GIC table complete through Jul–Sep 2026 (11.43%) ✔, super 12% ✔, company 25%/30% ✔, IAWO $20k ✔. **The reference data is current and correct.**
- Lodgement due dates centralized in `dueDates.ts` — BAS 28th-of-month-after-quarter, company tax 31 Jan, individual 31 Oct, super 28th. Matches ATO.
- Cache: localStorage `gstcalc-ato-rates`, 7-day expiry, schema-validated on read, order-insensitive payload diff for staleness detection. Clean.

---

## 8. Test & CI Status

| Check               | Result                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `npm test` (vitest) | **162/162 pass** (17 files), run 2026-09-21 on this tree                                          |
| `npm run lint`      | Configured `--max-warnings=0`; run in CI                                                          |
| `npm run typecheck` | Run in CI (`tsc --noEmit`)                                                                        |
| CI workflow         | `build.yml`: lint + typecheck + `npm run package` on `v*` tags; **tests are NOT run in CI** (gap) |
| Pre-commit          | Husky + lint-staged (ESLint --fix + Prettier on staged ts/tsx/json/md)                            |

**Note:** vitest was slow in this run (~76s incl. setup) but green; `electron/security.test.ts` covers the URL allow-list policy.

---

## 9. Findings (ranked)

### 🔴 High

**F1. Version displayed ≠ app version; both fallbacks are hardcoded and stale**

- `src/App.tsx:28`: `import.meta.env['VITE_APP_VERSION'] ?? '0.1.20'` — but `VITE_APP_VERSION` is **never set anywhere** (no `.env`, not injected in CI, not in any workflow). The header badge therefore always shows `0.1.20` regardless of the actual built version.
- `src/components/modules/Settings.tsx:245`: fallback is `'0.1.6'` — badly stale.
- **Fix:** inject the real version at build time from `electron-builder` (package.json) — e.g. `electron.main` exposes `process.env.npm_package_version`, or CI sets `VITE_APP_VERSION=${{ github.ref_name }}` before `vite build` in `build.yml`. Drop both hardcoded fallbacks (or make Settings read the packaged version via preload).
- This also explains the earlier user-visible confusion of the installed app showing an old version string.

**F2. Preload `versions.app()` returns the Electron version, not the app version**

- `electron/preload.ts:6`: `app: () => process.versions.electron`. Settings labels it "Electron:" so it's only cosmetically wrong there, but the API name lies. If any UI uses `versions.app()` expecting the app version it will display Electron's version.
- **Fix:** `process.env.npm_package_version` in the main→preload path, or `app.getVersion()` exposed via IPC. Rename to `versions.electron` or provide both.

**F3. `npm run update:rates` is broken — validation requires a `lodgements` key the data no longer carries**

- `scripts/update-ato-rates.ts` `assertValidPayload` requires `lodgements` in the payload (`requiredKeys`), but the schema marks it optional (`ato.schema.ts:143`) and the actual payload has no top-level `lodgements`. Every run therefore fails validation on both sources and silently "Retains existing rate files."
- It also fetches from the repo's own `main` branch (`raw.githubusercontent.com/MikeHuntswarm/GstCalc/main/data/ato-rates.json`) as both PRIMARY_SOURCE _and_ fallback — i.e. it copies the repo's committed copy to itself; it cannot pull fresh rates from the ATO.
- **Fix:** remove `lodgements` from requiredKeys (or point the script at a real updater source); decide whether the ATO-sync path should live in the removed cron workflow's replacement.

### 🟡 Medium

**M1. Tests not run in CI.** `build.yml` runs lint + typecheck + package but never `npm test`. 162 tests can rot unnoticed. Add a `npm test -- --run` step (CI env).

**M2. Unused dependencies.**

- `baseline-browser-mapping` (devDep): 0 src refs — remove.
- `@radix-ui/react-select` (dep): 0 src refs — nothing imports it (tabs is used). Remove.

**M3. `Reminders.tsx` is 618 lines.** The largest component; overdue for the same split pattern applied elsewhere (form / list / logic → store or lib). Not blocking, but the codebase already proved this pattern pays off.

**M4. Duplicate data files tracked.** `data/ato-rates.json` and `public/data/ato-rates.json` are both committed and currently identical, but nothing enforces sync except the manual updater script (which is broken — F3). One should be the source and the other generated/copy-at-build (Vite already serves `public/`; `data/` exists only as the canonical edit target).

**M5. Hardcoded fallback tax constants in `constants.ts`** (`SUPER_GUARANTEE_RATE = 0.12`, company 25/30%) duplicate the JSON data. They're marked "examples — actual values should come from ATO data" but are live fallbacks in SuperCalculator. Low risk today (values are current), but they can drift independently of the data file — the exact failure class this app is prone to.

### 🟢 Low / Hygiene

- **L1.** No `.env*` files at all → confirm lint-staged's Prettier for `*.env*` isn't missing; n/a.
- **L2.** `electron/ipc.ts` redefines `NOTIFICATION_COOLDOWN = 1000` locally while `constants.ts:47` also defines it (renderer-side). Single-source it.
- **L3.** `data/ato-rates.json` `metadata.lastUpdated` = 2026-07-09 vs file mtime Aug 9 — the file was touched after the metadata date; harmless but the metadata is the display source, keep them honest.
- **L4.** `review` leftovers: `REVIEW-AND-IMPROVEMENTS.md` and the prior review from July are stale relative to the refactor — archive or update pointers.
- **L5.** Fix the "React Version: {import.meta.env.MODE}" label in Settings — `MODE` is Vite's build mode ("production"), not a React version. Misleading display.

---

## 10. Project Health

- **Healthy.** Clean architecture for the scope, strong test suite (162 green), current & verified ATO data, sane Electron security posture (sandbox, contextIsolation, URL allow-list, narrow preload bridge).
- Test/type/lint gate is decent locally; CI could be stricter (missing tests step).
- The July refactor (module splits, pure-lib extraction) is a genuine improvement — continue the pattern rather than rewriting.
- **No rewrite needed.** Stack is right for the domain; a hypothetical Tauri migration would port React + logic directly, but Electron's updater + notifications work well here — not worth churn.

**Suggested fix order:** F1+F2 (version truth) → F3 (rates updater) → M1 (CI tests) → M2 (deps) → M3 (Reminders split) → M4 → rest hygiene.

---

_Generated by Hermes codebase review, 2026-09-21. Verification: 162/162 tests ran green on this tree; ATO reference values cross-checked against the skill's verified source table (Jul 2026)._
