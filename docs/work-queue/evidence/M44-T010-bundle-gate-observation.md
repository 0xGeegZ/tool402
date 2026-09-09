# M44-T010 official SDK bundle-gate observation

## Attempt

The approved exact SDK version was resolved with the recorded integrity value.
The Web dependency assertion and a minimal client-island side-effect import
were then evaluated without supplying a trusted configuration, durable attempt,
wallet, provider, or transaction.

## Results

- The strict static-shell test and Node 22.21.1 Web typecheck passed.
- The default Turbopack build stopped in the known host CSS-worker port-bind
  restriction, before an SDK diagnostic.
- An equivalent Webpack build with Cache Components enabled completed, with the
  existing optional `@x402/paywall` warning from the accepted RiskScan path.
- The minimal island is not reachable from a production route or component, so
  neither the island nor the SDK appears in the emitted client manifests. That
  build cannot establish the required client-bundle compatibility proof.
- The official SDK root entry invokes `dotenv.config()` on module evaluation.
  Mounting that root import would exceed M44's current no-configuration and
  no-mount authority.

## Verdict

BLOCKED. The experimental package, lockfile, assertion, and island must remain
uncommitted and are removed after this observation. A new scoped authority must
either name a browser-safe official SDK entry with a real non-executing mount
or expressly resolve the root-entry environment side effect before a new bundle
gate is attempted. No configuration bridge, durable attempt, wallet/provider
interaction, transaction, deployment, or live behavior is authorized.
