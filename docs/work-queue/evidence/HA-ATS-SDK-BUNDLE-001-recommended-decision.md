# HA-ATS-SDK-BUNDLE-001 — Recommended decision packet

## Status and scope

**ACCEPTED — scoped local bundle authority.** The human operator accepted this
packet at `2026-09-09T18:48:27Z`; the root records that acceptance in
`HA-ATS-SDK-BUNDLE-001` and `D-M44-010-006`. This is the scoped authority the
root requested in
[the M44 bundle-gate observation](M44-T010-bundle-gate-observation.md) after
it recorded `D-M44-010-005` (BUNDLE GATE BLOCKED). It becomes authority only
when the human operator accepts it and the root records that acceptance as a
decision row and a human-action row.

- Prepared and accepted: `2026-09-09T18:48:27Z` by the human operator's
  delegated session under the completed
  [HI-006 authority card](../queue/60-done/HI-006-ats-sdk-bundle-authority.md).
- Decision owner: human operator (repository owner); root records the local
  queue state only.

## Basis

Checked against the npm registry on 2026-09-09:
`@hashgraph/asset-tokenization-sdk@8.0.0` publishes exactly one export
condition, `"."`, resolving to `./build/esm/src/index.js` (import) and
`./build/cjs/src/index.js` (require), with `dotenv ^16.3.1` as a runtime
dependency. No browser-specific subpath, `browser` field, or side-effect-free
entry exists. The root's first alternative, a browser-safe official entry,
therefore cannot be named; only the second alternative, expressly resolving
the root-entry environment side effect, remains.

`dotenv` 16 wraps its file read in a try/catch and returns `{ error }` rather
than throwing when no filesystem is available. In a Next.js client bundle the
Node built-ins it requires resolve to empty fallbacks, so `dotenv.config()` at
module evaluation reads no file, sets no value, and is expected not to throw.
That expectation is not yet proven in this repository; the ruling below makes
the proof the gate.

## Ruling proposed

1. The `dotenv.config()` evaluation performed by the official SDK root entry
   is accepted as a bounded, non-configuring side effect in the client bundle.
   It grants no configuration read: the web workspace supplies no `.env`
   value to the SDK, the accepted S16 no-environment-read boundary stays in
   force for every S16 and S21 file, and the SDK import is confined to the
   declared M44 client module and island.
2. M44-T010 may mount its client island once on the accepted
   `/provider/deploy` review step as a non-executing control: it renders the
   stage 3 first sub-step control in the `unavailable` or disabled state,
   invokes no SDK method, constructs no client, reads no configuration, and
   touches no wallet or provider. The mount exists so the SDK enters the
   emitted client manifest.
3. The bundle gate passes only when the equivalent Webpack production build
   completes with the island present in a client manifest and the route
   module evaluates in a browser without an uncaught error at import. If the
   SDK throws at evaluation, fails to bundle, or pulls a Node-only module into
   the client graph, M44 stops again and records the exact diagnostic; no
   shim, polyfill, patch, or fork is authorized by this ruling.
4. Nothing else changes. No trusted configuration bridge, durable attempt,
   wallet or provider interaction, `Bond.create` call, transaction,
   deployment, or live behavior is authorized; `HA-ATS-STAGE-B-001` remains
   the sole gate for execution.

## Cost if wrong

If the SDK cannot evaluate in a browser bundle, the attempt costs one more
root bundle-gate cycle and ends in the same BLOCKED state with better
evidence. No secret, account, or on-chain state is exposed at any point
because the mount executes nothing.
