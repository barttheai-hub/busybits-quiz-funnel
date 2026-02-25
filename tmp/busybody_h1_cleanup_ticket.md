# busybody.io — H1 cleanup ticket

## Problem
Multiple H1s detected on busybody.io pages. This can dilute primary topic signals and is generally avoidable.

## Acceptance criteria
- Each indexable page has exactly **one** primary H1.
- Secondary headings are H2/H3.
- No visual regressions.

## Implementation checklist
- Audit homepage + top landing pages.
- Choose the primary H1 (usually hero headline).
- Convert additional H1s to H2/H3.
- Re-run Lighthouse/SEO checks to confirm heading structure.

## Verification
- View rendered DOM / page source: only one `<h1>`.
- Spot-check on mobile + desktop.
