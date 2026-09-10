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

## Turbopack retry result

Under Node 22.21.1, the default Next build path reached the real static SDK
import. The four upstream-compatible aliases removed the prior `winston`,
`winston-daily-rotate-file`, and `fs` diagnostics. The one remaining native
BBS diagnostic now uses the package-provided WebAssembly fallback only in the
browser graph and preserves the native package as a Next server external,
authorized by `D-M44-010-008` and `D-M44-010-009`; no SDK method,
configuration source, wallet, provider, or transaction was evaluated.

The resulting default Turbopack production command has no remaining SDK or
alias diagnostic. It still cannot complete in this host because Next's CSS
worker cannot bind its required local port (`Operation not permitted`), which
is outside the SDK graph. The constrained compile-mode retry reaches the same
host restriction.

The runtime client proof is clear: default `next dev` (Turbopack) served
`/provider/deploy` with HTTP 200; its emitted client chunks include the
official Asset Tokenization SDK and BBS WASM package; and the mounted disabled
Stage 3 control exposed `data-sdk-bundle="loaded"`. Browser-console inspection
recorded zero uncaught import-time errors. The control invoked no SDK method.

## Direct-contract comparison

The bounded [official contracts + viem spike](M44-T010-contracts-viem-spike.md)
found that the published Factory artifact can enter the same Turbopack client
route without any SDK compatibility alias, and that viem encodes the official
`deployBond` tuple from the accepted Stage-B configuration shape. It made no
wallet, provider, RPC, simulation, or transaction call. The next seam is
therefore covered by the prefilled
[contracts + viem decision packet](HA-ATS-CONTRACTS-VIEM-001-recommended-decision.md),
which awaits a human choice.

## Current verdict

The SDK client graph is a verified **fallback bundle proof**, not proof that
`Bond.create()` is executable in Tool402. It must not be merged as M44's final
execution seam until the human chooses between it and the direct-contract
packet. The host-blocked full production command is recorded separately and is
not claimed as deployment or release evidence. No configuration bridge,
durable attempt, wallet/provider interaction, transaction, deployment, or
live behavior is authorized.
