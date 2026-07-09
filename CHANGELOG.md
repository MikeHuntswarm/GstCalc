# Changelog

All notable changes to GstCalc.

## [0.1.17] — 2026-07-09

### Fixed

- Repo URLs updated (`your-username` → `MikeHuntswarm`, `master` → `main`)
- `electron-updater` config: `private: false` for public repo
- `sandbox: true` in BrowserWindow for improved security
- Update script URLs (`tsvillain` → `MikeHuntswarm`)
- Footer links in app point to correct GitHub pages
- Dark mode polish on OverviewDashboard (text + background variants)
- Penalty integration test assertion fixed

### Added

- Stale ATO data notification banner (appears when data >7 days old)
- ATO investigation risk score card on OverviewDashboard
- 24 tests for all 9 risk detectors (`atoInvestigationRisk.test.ts`)
- 21 tests for LodgementHistory store (`lodgement-store.test.ts`)
- Weekly cron job to refresh ATO rates

### Changed

- Extracted 200 LOC of inline BAS/income tax import data to `src/data/`
- Removed duplicate `ReminderCategory` from constants.ts

### Removed

- Unused `jspdf` dependency (44 packages)
- Stale `.project-state.json` and `PROJECT_PLAN.md` scaffolding

### Dependencies

- Added `@testing-library/dom` (enables 2 component test suites)
- `npm audit fix` resolved 30 vulnerabilities

## [0.1.16] — 2026-01-19

### Added

- Income tax lodgement import for trust returns 2020–2022
- Automatic late lodgement tracking
- ATO investigation risk analysis with 10 detectors
- BAS history bulk import with debt/refund tracking
- Penalty tracking and income tax support
- Enhanced Edit/Delete button visibility
- Auto-scroll to edit form

### Fixed

- Date strings converted to ISO 8601 format
- Catch-up planner total calculation
- Dark mode input text visibility
- Electron-builder artifact naming for auto-updater

## [0.1.15] — 2025-12-23

### Added

- Comprehensive lodgement history with ATO investigation risk analysis
- Reminder auto-populate dropdowns
- Dark mode updater visibility
- Visual feedback for update checking

## [0.1.5] — 2025-11-19

### Changed

- ATO data refresh: updated tax brackets, Medicare thresholds, penalty unit values
- Electron-builder publish owner updated
- Enhanced AnnualBusinessTax tests

## [0.1.4] — 2025-10-27

### Added

- App update functionality
- Reminders with notification support
- Medicare levy, offsets, and small business updates
- Unit tests for GST calculations

### Fixed

- ATO data fetching with multiple loading strategies
- Missing dueDate handling in reminders

## [0.1.3] — 2025-10-08

### Added

- Annual Business Tax estimator component
- BAS lodgement reminder scheduling
- Notification handling with support check

### Changed

- Migrated to Zustand for state management
- Enhanced BusinessTools with reminder functionality

## [0.1.0] — 2025-09-16

### Added

- Initial release
- GST Calculator (exclusive/inclusive mode)
- Income Tax Calculator with bracket display
- Electron desktop shell with auto-update
- Business tools with penalty estimator
- Catch-up planner and overview dashboard
- Super calculator and franking credits
