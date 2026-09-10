# M44-T030 implementation plan

## Goal

Repair only the valid ABI-decoded EIP-55/mixed-case `BondDeployed` address
boundary while keeping trusted configuration address validation lowercase-only.

## Steps

1. Obtain independent readiness and activate only
   `apps/web/tests/factory-deploy-bond.test.mjs` for durable RED; source remains
   prohibited.
2. Add RED cases using the official Factory artifact for mixed-case success,
   lowercase success, zero/malformed address rejection, wrong/malformed event
   rejection, and unchanged encoding/artifact assertions.
3. Independently review RED. If failures are confined to the current
   decoded-address parser, authorize only
   `apps/web/src/lib/ats/factory-deploy-bond.ts` and its matching focused test.
4. Add a private decoded-event address validator that validates first and then
   lowercases only valid non-zero addresses; preserve the trusted configuration
   parser unchanged.
5. Run focused/relevant Web validation, independent task and module review,
   then accept only the local pure correction.

## Boundaries

No package, lockfile, SDK/browser compatibility, provider, wallet, RPC,
simulation, transaction, candidate, deployment, Mirror, or live action may
change or run.
