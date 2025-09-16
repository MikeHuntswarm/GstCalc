# Penalty reference

GSTCalc highlights the two primary ATO charges that affect late lodgements:

## Failure to Lodge (FTL)

- Charged per document (BAS, income tax return, FBT return, etc.).
- One penalty unit applies for each 28-day period (or part thereof) the lodgement remains outstanding.
- Small entities (turnover < $10 million) are capped at five penalty units. Medium and large businesses can incur
  higher caps (up to 25 or 125 units respectively).
- Penalty unit value changes periodically. The dataset bundled with GSTCalc currently assumes **AUD $313** per unit
  (effective 1 July 2024).

## General Interest Charge (GIC)

- Applies daily to outstanding tax debts, compounding at the GIC rate published quarterly by the ATO.
- The GIC rate equals the 90-day Bank Accepted Bill rate plus a fixed uplift (currently 7%).
- Interest continues to accrue until the balance is cleared. GIC is tax-deductible in many circumstances.

## Using the in-app estimator

- Enter the number of days late to estimate FTL exposure. The app multiplies the penalty unit rate by the number of
  28-day periods (capped for small entities) to provide an indicative cost.
- The general interest charge description is surfaced alongside the estimate to encourage proactive payment plans.
- Always confirm penalties directly with the ATO; individual cases may vary based on lodgement history and remission
  requests.
