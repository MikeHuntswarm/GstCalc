# GstCalc — Codebase Review

**Reviewed:** 2026-07-09  
**Reviewer:** Hermes Agent (codebase-review skill)  
**Version:** 0.1.16  
**Total source LOC:** 9,360 (51 files in `src/`)

---

## 1. Identity & History

| Attribute         | Value                                               |
| ----------------- | --------------------------------------------------- |
| **Name**          | GstCalc (npm: `gstcalc`)                            |
| **Description**   | Australian Tax & GST calculator desktop application |
| **Version**       | 0.1.16                                              |
| **First commit**  | 2025-09-16                                          |
| **Last commit**   | 2026-01-19                                          |
| **Total commits** | 73                                                  |
| **Author(s)**     | MikeHuntswarm (sole)                                |
| **License**       | ISC                                                 |
| **Repository**    | github.com/MikeHuntswarm/GstCalc                    |
| **Branch**        | `main`                                              |

**Activity pattern:** Heavy feature work Sep 2025 – Jan 2026 (73 commits in 4 months). Last commit Jan 19 — **5+ months of inactivity**.

---

## 2. What It Is

A **desktop-first Electron application** for Australian individuals and small businesses to calculate GST, estimate income tax (PAYG), track BAS lodgement history with ATO investigation risk analysis, manage reminders, and estimate penalties. Includes PDF export. Intended for offline use with cached ATO rate data refreshed periodically. Ships as a Windows NSIS installer with auto-update support via GitHub Releases.

---

## 3. Tech Stack

| Layer          | Technology                            | Role                                     |
| -------------- | ------------------------------------- | ---------------------------------------- |
| **Framework**  | Electron 38                           | Desktop shell                            |
| **UI**         | React 19 + Radix UI + Tailwind CSS 3  | Component library & styling              |
| **Language**   | TypeScript 5.9 (strict mode)          | Type safety                              |
| **Build**      | Vite 7                                | Dev server & bundler                     |
| **State**      | Zustand 5 (persist middleware)        | Client state + localStorage              |
| **Validation** | Zod 4                                 | Schema validation (ATO data, lodgements) |
| **PDF**        | jsPDF 3                               | PDF report export                        |
| **Dates**      | date-fns 4                            | Date manipulation                        |
| **Updates**    | electron-updater 6                    | Auto-update via GitHub Releases          |
| **Testing**    | Vitest 3 + Testing Library 16 + jsdom | Component & unit tests                   |
| **Lint**       | ESLint 9 + Prettier 3 + Husky 9       | Code quality gates                       |
| **CI/CD**      | GitHub Actions (Windows runner)       | Build & release pipeline                 |

---

## 4. Codebase Metrics

| Category                           | Files  | LOC       |
| ---------------------------------- | ------ | --------- |
| React components (modules)         | 13     | 5,613     |
| UI primitives (shadcn-style)       | 8      | 243       |
| State stores (Zustand)             | 4      | 702       |
| Calculation library                | 5      | 969       |
| Types & schemas (Zod)              | 5      | 516       |
| Utilities (logger, backup, errors) | 5      | 446       |
| Test files                         | 7      | ~950      |
| Config/entry (App, main, index)    | 4      | 312       |
| **Total**                          | **51** | **9,360** |

**Component size distribution:**

- LodgementHistory.tsx: 1,093 lines (largest file — UI + inline BAS import data)
- BusinessTools.tsx: 646 lines
- Reminders.tsx: 640 lines
- ATO investigation risk: 596 lines
- MissedLodgements.tsx: 471 lines
- AnnualBusinessTax.tsx: 436 lines

---

## 5. Architecture

```
┌─────────────────────────────────────────────┐
│                Electron Main                 │
│  main.ts: window, IPC, auto-updater, fetch  │
├─────────────────────────────────────────────┤
│              Preload Bridge                   │
│  preload.ts: contextBridge (gstcalc API)     │
├─────────────────────────────────────────────┤
│              React Renderer                   │
│  ┌─────────────────────────────────────────┐ │
│  │ App.tsx (tabs shell, ATO data loading)  │ │
│  │  ┌── OverviewDashboard                  │ │
│  │  ├── GstCalculator    ──► gst.ts        │ │
│  │  ├── IncomeTaxCalc    ──► incomeTax.ts  │ │
│  │  ├── BusinessTools    ──► penalties.ts  │ │
│  │  ├── LodgementHistory ──► atoInvest...  │ │
│  │  ├── MissedLodgements                   │ │
│  │  ├── AnnualBusinessTax                  │ │
│  │  ├── Reminders                          │ │
│  │  ├── SuperCalculator                   │ │
│  │  ├── FrankingCredits                    │ │
│  │  ├── Settings                           │ │
│  │  └── Updater                            │ │
│  └─────────────────────────────────────────┘ │
│  ┌───────────────────┐ ┌───────────────────┐ │
│  │  Zustand Stores   │ │  Lib              │ │
│  │  • ato (rates)    │ │  • calculations/  │ │
│  │  • lodgementHist  │ │  • logger         │ │
│  │  • reminders      │ │  • backup         │ │
│  │  • theme          │ │  • errors         │ │
│  └───────┬───────────┘ │  • constants      │ │
│          │              │  • utils          │ │
│  ┌───────▼───────────┐ └───────────────────┘ │
│  │   localStorage    │                       │
│  │   (Zustand persist + validation)          │
│  └───────────────────┘                       │
└─────────────────────────────────────────────┘
```

**Key patterns:**

- **Tabbed SPA shell** — `App.tsx` mounts all modules in `<Tabs>`, each wrapped in `<ErrorBoundary>`
- **ATO data as JSON** — loaded from `data/ato-rates.json` via Electron IPC (production) or fetch (dev), validated with Zod, cached in localStorage with 7-day expiry
- **Zustand persist everywhere** — all state is localStorage-backed with rehydration validation
- **Pure calculation functions** — `src/lib/calculations/` has no side effects, all functions take data in, return results out
- **No backend, no database** — entirely client-side; all data lives in `localStorage`

---

## 6. Feature Modules

### 6.1 GST Calculator (`GstCalculator.tsx`, 358 LOC)

Dual-mode (ex-GST / inc-GST) with adjustable rate, quick-amount buttons ($100, $1,000), per-value copy, summary copy, saved scenarios (max 10) with local storage persistence.

### 6.2 Income Tax Calculator (`IncomeTaxCalculator.tsx`, 404 LOC)

Financial year dropdown, weekly/annual frequency toggle, progressive bracket display, Medicare levy estimate, tax offset listing. Calculates net income, PAYG withholding, average/marginal rates.

### 6.3 Business Tools (`BusinessTools.tsx`, 646 LOC)

BAS estimation (sales, GST collected/credits → net GST), Failure to Lodge penalty estimator, quarterly BAS schedule display, ATO interest rates (GIC + benchmark), small business concessions (instant asset write-off, simplified depreciation), tax planning strategies. Most feature-dense component.

### 6.4 Lodgement History (`LodgementHistory.tsx`, 1,093 LOC) ★

CRUD for GST BAS and tax lodgements with inline form, filtering, summary statistics, **10 ATO investigation risk detectors**:

1. Consecutive late lodgements
2. Missing quarters (gaps)
3. Large amount variations (>100%)
4. Nil returns → large amounts
5. Excessive delays (>90 days)
6. Round number patterns (estimates flag)
7. Decreasing compliance trend
8. High penalty exposure ($)
9. Chronic non-compliance (>50% late)
10. Actual ATO penalties (hasPenalty field)

Risk scored 0–100 with severity: none/low/medium/high/critical. Includes embedded BAS history import data (15 records, 2020–2024).

### 6.5 Catch-up Planner (`MissedLodgements.tsx`, 471 LOC)

Identifies missing periods, estimates penalties, allows conversion to lodgement history.

### 6.6 Annual Business Tax (`AnnualBusinessTax.tsx`, 436 LOC)

Base rate entity eligibility checker (turnover + passive income thresholds), dual-rate comparison (25% vs 30%), savings calculation.

### 6.7 Reminders (`Reminders.tsx`, 640 LOC)

CRUD reminders with BAS quarter/year auto-populate, category filtering, notification scheduling (7/3/1/0 days before), desktop notifications via Electron IPC.

### 6.8 Other Modules

- **OverviewDashboard** (143 LOC): ATO data status, upcoming deadlines, company tax snapshot
- **SuperCalculator** (322 LOC): Super guarantee estimate
- **FrankingCredits** (308 LOC): Dividend franking credit calculator
- **Settings** (261 LOC): Data backup/restore, import/export, clear data, storage info, debug toggle
- **Updater** (154 LOC): Check for updates, download progress, install

---

## 7. Data Model

### ATO Data Schema (`src/types/ato.ts` + `ato.schema.ts`)

Hierarchical JSON validated with Zod:

- `AtoData` → metadata, gst, individual (brackets, medicare, offsets), company (base/full rate), penalties, lodgements, taxPlanning, smallBusiness, interestRates
- Tax brackets: `{threshold, baseTax, rate}`
- Penalties: `failureToLodge {unitValue, maxUnits, frequencyDays}` + GIC

### Lodgement Records (`src/types/lodgement.ts` + `lodgement.schema.ts`)

- `LodgementRecord`: id, type (gst-bas|company-tax|income-tax), year, quarter, status, dates, amount, penalty fields, notes, source
- `LodgementSummary`: aggregate stats (counts, totals, late days, penalties)
- `LodgementFilters`: multi-dimension filtering

### Storage Keys

```
gstcalc-ato-rates, gstcalc-reminders, gstcalc-gst-scenarios,
gstcalc-income-scenarios, gstcalc-theme, gstcalc-settings,
gstcalc-debug, gstcalc-lodgement-history
```

---

## 8. Test Infrastructure

| Aspect          | Detail                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| **Runner**      | Vitest 3                                                                       |
| **Environment** | jsdom                                                                          |
| **Setup**       | `src/setupTests.ts` (empty)                                                    |
| **Libraries**   | @testing-library/react, @testing-library/user-event, @testing-library/jest-dom |
| **Test files**  | 7 files (~950 LOC)                                                             |

### Test Coverage

| Test file                              | What it covers                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `gst.test.ts` (101 LOC)                | Exclusive/inclusive GST with rounding, validation errors, mode dispatch       |
| `incomeTax.test.ts` (57 LOC)           | Real ATO bracket boundary tests for 2024-25 and 2023-24                       |
| `penalties.test.ts` (132 LOC)          | FTL penalty: zero, negative, single/multi period, cap, floor fractions        |
| `GstCalculator.test.tsx` (106 LOC)     | Component render, exclusive mode calc, inclusive mode calc                    |
| `AnnualBusinessTax.test.tsx` (276 LOC) | Eligibility, rate switching, savings display, zero income, passive % clamping |

**Assessment:** Solid unit tests for core math (GST, income tax, penalties) and two component integration tests. No tests for LodgementHistory (largest component), BusinessTools, Reminders, or the risk detection engine. No E2E tests.

---

## 9. Code Quality

### Strengths

- **Strict TypeScript** (`strict: true`) throughout — good type safety
- **Zod validation** on all persisted data — prevents corrupt localStorage from crashing the app
- **ErrorBoundary** wrapping every tab — individual module crashes don't kill the app
- **Pure calculation layer** — all tax math is isolated, testable, side-effect-free
- **Well-structured stores** — Zustand patterns are clean, consistent, with custom storage for validation
- **Lint staged + Husky** — pre-commit quality gates
- **Security-conscious Electron** — contextIsolation: true, nodeIntegration: false, domain whitelist on IPC fetch
- **Logging infrastructure** — Logger class with in-memory buffer, debug toggle
- **Backup/restore** — full data export/import with format validation

### Concerns (ranked by severity)

#### HIGH

1. **Release artifacts in repo** (`release/` folder: 134 MB of .exe, .pak, .dll files). The v0.1.16 installer (69 MB) and win-unpacked directory are committed to git. **This bloats the repo and should be in .gitignore.** Releases should only live in GitHub Releases artifacts.

2. **Stale project-state** — `.project-state.json` is a shell (all TBD placeholders, last updated Jan 15). The plan was never filled in. Either maintain it or delete it.

3. **`electron-updater` private repo token reliance** — `GH_TOKEN` env var used for private repo updates. If the repo is public (which it appears to be — github.com/MikeHuntswarm/GstCalc), the `private: true` in `setFeedURL` is incorrect and will cause update failures.

4. **Hardcoded placeholder URLs** — `github.com/your-username/GstCalc` appears in `package.json` repository field and in the footer links in App.tsx. These are dead links.

#### MEDIUM

5. **Massive embedded data in component** — `LodgementHistory.tsx` has 90+ lines of hardcoded BAS_HISTORY_IMPORT array. This is sample/test data that shouldn't live in a component. Move to a separate data file or test fixture.

6. **No test coverage for risk engine** — The 596-line `atoInvestigationRisk.ts` with 10 detectors has zero tests despite being the most complex logic in the app.

7. **`electron-updater` imported via `createRequire`** — `main.ts` line 7 uses `createRequire` to import ESM-hostile `electron-updater`. This works but is fragile. Consider migrating to dynamic import or waiting for proper ESM support.

8. **`sandbox: false` in BrowserWindow** — Electron best practice is `sandbox: true`. It's disabled here, reducing security isolation.

9. **Reminder `checkDueReminders` uses raw IPC send** — the `sendNotification` function (in `lib/notifications.ts`) calls `window.gstcalc.sendNotification()` which goes through preload → IPC. This is fine architecturally, but the rate limiting is only on the main process side (1s cooldown). If `checkDueReminders` fires rapidly (e.g., component re-render loop), it could overwhelm before hitting the cooldown.

#### LOW

10. **Duplicate `ReminderCategory` type** — defined in both `constants.ts` (`'BAS' | 'Tax Return' | 'Superannuation' | 'Custom'`) and `reminders.ts` (`'bas' | 'tax_return' | 'superannuation' | 'custom'`). They're different values — the constants one is unused (`REMINDER_CATEGORIES` array).

11. **`any` types in `gst.test.ts`** — lines 6-11 have test code that doesn't compile cleanly (missing `it(`). The file appears to have been partially corrupted or poorly refactored.

12. **No dark mode for charts** — the OverviewDashboard cards use hardcoded `bg-slate-50`/`text-slate-900` in some places, but the app uses Tailwind dark mode classes (`dark:bg-slate-800`) elsewhere. Inconsistency.

13. **`vite-env.d.ts`** (47 LOC) is redundant — Vite generates this automatically.

---

## 10. Project Health & Recommendations

### Current State

- **5+ months since last commit** (Jan → Jul 2026)
- No open issues/PRs visible in the repo
- `.project-state.json` and `PROJECT_PLAN.md` are unfilled shells
- All ATO rate data would be **stale** since Jan 2026 — the 7-day cache was last filled in January

### Quick Wins (prioritized)

| #   | Action                                                                                      | Effort |
| --- | ------------------------------------------------------------------------------------------- | ------ |
| 1   | Remove `release/` folder from git tracking, add to .gitignore                               | 5 min  |
| 2   | Fix `your-username` → `MikeHuntswarm` in package.json + App.tsx links                       | 5 min  |
| 3   | Change `private: true` → `private: false` in electron-updater config if repo is public      | 1 min  |
| 4   | Extract BAS_HISTORY_IMPORT array from LodgementHistory.tsx into separate data file          | 10 min |
| 5   | Remove duplicate `ReminderCategory` from constants.ts or align with the one in reminders.ts | 5 min  |
| 6   | Set `sandbox: true` in BrowserWindow (test first — may break preload)                       | 15 min |

### Medium-Term

| #   | Action                                                                                           |
| --- | ------------------------------------------------------------------------------------------------ |
| 7   | Write tests for `atoInvestigationRisk.ts` detectors — these are the highest-value untested logic |
| 8   | Add tests for LodgementHistory store (CRUD, validation, duplicate detection)                     |
| 9   | Migrate `electron-updater` import from `createRequire` to native ESM when supported              |
| 10  | Add E2E smoke tests (Playwright + Electron) for critical paths: GST calc, auto-update check      |

### Observations

- The app is **feature-complete** for its domain — GST, income tax, BAS, reminders, risk analysis — a surprisingly deep feature set for a solo project
- The **ATO investigation risk engine** is the standout feature — 10 detectors with severity scoring is thoughtful and genuinely useful
- Architecture is **solid and conventional** for an Electron+React app — no architectural red flags
- The **project management scaffolding** (project-state, PROJECT_PLAN, multiple .prompts files, Claude skills) was set up ambitiously but never maintained — consider pruning what isn't used

---

## 11. Security

| Check                                        | Status                          |
| -------------------------------------------- | ------------------------------- |
| `contextIsolation: true`                     | ✅                              |
| `nodeIntegration: false`                     | ✅                              |
| IPC domain whitelist                         | ✅ (3 GitHub domains)           |
| Zod validation on all persisted data         | ✅                              |
| External links opened in OS browser          | ✅                              |
| Error boundary prevents white-screen crashes | ✅                              |
| `sandbox: true`                              | ❌ (disabled)                   |
| ATO data fetched over HTTPS only             | ✅ (GitHub domains)             |
| No secrets in source                         | ✅ (uses env vars for GH_TOKEN) |

---

## Summary

GstCalc is a **well-built, feature-rich Electron desktop app** with solid TypeScript, reasonable test coverage on core math, and a genuinely useful ATO investigation risk engine. It shows the signs of a solo developer who knows the domain and cares about quality. The main issues are **housekeeping**: stale release artifacts in the repo, broken placeholder URLs, unfilled project planning scaffolds, and ~5 months of neglect. Fixing the 6 quick wins would bring it to production-clean state.
