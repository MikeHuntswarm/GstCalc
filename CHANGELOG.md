# Changelog

All notable changes to this project will be documented in this file. Run `npm run release:prepare` to append new entries automatically.

-## [0.1.5] - 2025-11-25
- feat: Refresh ATO datasets with GST 10% confirmation, 2025-26 resident tax brackets, Medicare low-income thresholds, $330 Failure to Lodge penalties, and the latest GIC/Division 7A benchmark rates sourced from [ATO GST guidance](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/how-gst-works), [resident income tax rates](https://www.ato.gov.au/rates/individual-income-tax-rates/), [Medicare levy reduction pages](https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners) / [family thresholds](https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-family-income), [Failure to lodge penalty guidance](https://www.ato.gov.au/individuals-and-families/paying-the-ato/interest-and-penalties/penalties/failure-to-lodge-on-time-penalty), [GIC rates](https://www.ato.gov.au/Rates/General-interest-charge-%28GIC%29-rates/), and the [Division 7A benchmark interest rate](https://www.ato.gov.au/tax-rates-and-codes/division-7a-benchmark-interest-rate/).
- fix: Harden AnnualBusinessTax UI to expose deterministic data-testids for each card, summary block, and checklist detail so specs can target unique nodes.
- test: Tighten AnnualBusinessTax and incomeTax specs and rerun `corepack pnpm vitest run src/components/modules/AnnualBusinessTax.test.tsx src/lib/calculations/incomeTax.test.ts --reporter=dot` to confirm green.
- feat: Add unit tests for GST calculations and input validation, including error handling for invalid inputs
- feat: Add comprehensive implementation plan for GSTCalc project with prioritized tasks and expected outcomes
- feat: Enhance ATO data fetching with multiple loading strategies and improve type definitions for Electron API
- feat: Implement reminders functionality with notification support
- fix: Update ATO rates source URLs to point to the correct repository
- feat: Update ATO rates JSON with Medicare levy and offsets details
- fix: Handle missing dueDate in reminders
- feat: Add app update functionality
- Add Medicare levy, offsets, and small business updates
- feat: Add comprehensive AI software development guidelines and documentation protocols
- Fix auto-select of financial year after data load
- refactor: migrate to Zustand for state management and remove useAtoRates hook
- feat: Implement BAS lodgement reminder scheduling
- feat: enhance notification handling with support check and logging
- feat: add ATO rates fetching functionality and integrate with preload script
- feat: enhance BusinessTools component with reminder functionality and notifications
- chore: update package-lock.json with new dev dependencies
- update src/components/modules/AnnualBusinessTax.tsx
- 0.1.3 added annual report and changelog
- feat: add Annual Business Tax estimator component and integrate into App
- upate
- chore: update vitest dependency to version 3.2.4
- BAS  yearly lodgement date tax mitigation straturgy
- idk
- idk wtf im doing
- Fix inclusive income tax thresholds and add tests
- Respect default GST rate updates when not customised
- Wire GST rate into business tools
- Adjust failure to lodge period calculations
- Fix GST autofill to derive inclusive component
- Json
- round 1
- Initial commit
## [0.1.4] - 2025-11-25

UI/UX polish, support docs, and installer updates

- fix: Updater now gracefully handles non-Electron contexts and is fully typed
- fix: Business tools and reminders show clearer warning/confirmation states
- docs: add docs/support.md and footer links for support/privacy/legal info
- chore: regenerate installer with latest code and data

## [0.1.3] - 2025-09-25

Add Annual Business Tax estimator

- feat: add Annual Business Tax estimator component and integrate into App
