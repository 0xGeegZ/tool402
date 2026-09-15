# S48-T010 RED acceptance

## Source and command

- Source: `10233dae2e27a4c26cc9417eb3f9794082d3ffcd`.
- Command: `node --test apps/web/tests/product-landing.test.mjs apps/web/tests/public-landing-reconciliation.test.mjs` under Node 22.21.1.

## Observed result

The focused run has 12 tests: 7 pass and 5 fail. Each failure is expected:

1. the hero still uses the old Back framing rather than the marketplace
   promise and developer-to-agent explanation;
2. the primary and repeated demo CTAs still use the old labels;
3. the cards still expose campaign/route metadata rather than product task and
   result facts;
4. root metadata still uses the former generic description; and
5. the benefits heading still describes route boundaries instead of payment
   control.

No production source changed in that commit. The failure demonstrates the
approved copy contract detects the absent landing message, not a test setup
error.

## Decision

S48 may now make the minimal GREEN amendments to its four declared source
seams. It must preserve styling, local routes, and every excluded runtime
boundary.
