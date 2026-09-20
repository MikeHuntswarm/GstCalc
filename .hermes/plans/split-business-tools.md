# #3 — Split BusinessTools god-component

**Goal:** Turn the 654-line `BusinessTools.tsx` (six tools, 4 input states, 6 useMemos, 3 stores) into a thin composition of per-feature components. Fix the untested GST autofill that duplicates `calculateFromInclusive`.

**Design:** Each feature becomes a **pure-function component taking typed props** (not store reads) → independently testable, matches the app's propagation pattern. `BusinessTools` reads stores once, destructures, passes props.

## New files (in `src/components/modules/business/`)

| File                           | Feature                               | Props (from AtoData)                                |
| ------------------------------ | ------------------------------------- | --------------------------------------------------- |
| `CompanyTaxReference.tsx`      | company tax quick reference           | `baseRate`, `fullRate`                              |
| `GstBasHelper.tsx`             | GST BAS 1A/1B helper                  | `gstRate` (owns sales/coll/credit state)            |
| `BasSchedule.tsx`              | BAS schedule + reminder toggles       | `basQuarters`, reminders store                      |
| `SmallBusinessConcessions.tsx` | IAWO + depreciation pool              | `instantAsset`, `simplifiedDepreciation`            |
| `PenaltyAwareness.tsx`         | FTL penalty estimator                 | `penalties.failureToLodge`, `generalInterestCharge` |
| `InterestBenchmarks.tsx`       | GIC + Division 7A rates, GIC reminder | `interestRates`                                     |

The remaining two (Lodgement calendar, Tax mitigation ideas) stay **inline in BusinessTools** — they're read-only render helpers with no state, so extraction buys nothing; the deletion test: extracting them would scatter, not concentrate. Keeps the split honest (deep module, not churn).

## Fixes during split

- **GST autofill bug:** replace `parsedSales * (gstRate / (1 + gstRate))` with the tested `calculateFromInclusive(parsedSales, gstRate).gst` (they disagree on rounding; the tested fn is authoritative).

## Tests (new, one per feature component)

- `CompanyTaxReference.test.tsx` — renders both rates + criteria
- `GstBasHelper.test.tsx` — net GST math; autofill calls GST extraction (mock-free: pass real values, assert output)

## Verify

- `npx tsc --noEmit` (non-test errors), `npx vitest run` (existing 132 + new)
- Commit; stop at boundary.
