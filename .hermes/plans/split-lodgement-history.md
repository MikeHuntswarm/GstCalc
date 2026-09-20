# #4 — Split LodgementHistory monolith

**Goal:** 931-line `LodgementHistory.tsx` mixes form, filters, CSV export, bulk import, summary, risk wiring. The risk engine is tested (24 tests); the wiring around it is not. Extract the data-corrupting logic (import/export/date-conversion) into pure functions, and the form/filters into components.

## New pure modules (highest value, lowest risk)

| File                     | Contents                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/lodgementExport.ts` | `toCsv(records): string` — header + escaped rows (moved from inline)                                                                                      |
| `lib/lodgementImport.ts` | `toIsoDate(dateStr): string` (adds `T00:00:00` + toISOString); `importRecords(records, addFn)` — shared bulk-import loop with success/skip/error counting |

## New components (in `components/modules/lodgement/`)

| File                   | Props                                            |
| ---------------------- | ------------------------------------------------ |
| `LodgementForm.tsx`    | form state + `onSubmit`, `onCancel`, `editingId` |
| `LodgementFilters.tsx` | filter state + `onChange`, `onClear`             |

## Fixes during split

- **Duplicated filtering:** component re-implements `getFilteredLodgements` inline (lines 79–103). Replace with the store's `getFilteredLodgements(filters)` — one predicate.
- **Date conversion** `new Date(record.dueDate + 'T00:00:00')` centralised in `toIsoDate`.

## Tests

- `lodgementExport.test.ts` — header, escaping (quotes/commas), empty
- `lodgementImport.test.ts` — toIsoDate, import counting (success/skip/error)

## Verify

- `npx tsc --noEmit` (non-test), `npx vitest run` (139 + new)
- Commit; stop at boundary.
