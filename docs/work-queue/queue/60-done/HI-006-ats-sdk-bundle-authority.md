# HI-006 — ATS SDK bundle authority

## Purpose

Human intake card. The root recorded `D-M44-010-005` (BUNDLE GATE BLOCKED)
after its single authorized official-SDK bundle-gate attempt: the pin and
typecheck passed, but the island was unreachable from any route, so the SDK
never entered a client manifest, and the SDK root entry evaluates
`dotenv.config()` on import, which the card's no-configuration/no-mount
boundary did not permit. The root asked for a new scoped human decision
before any retry. This card carries that decision. It authorizes no
configuration bridge, durable attempt, wallet, provider, transaction,
deployment, or live action.

## State

- Tier: intake
- Queue state: 60-done
- Dependencies: none
- Raised by: human operator, 2026-09-09
- Owner: human operator accepted the ruling; root recorded the corresponding
  local queue state.
- Human actions: `HA-ATS-SDK-BUNDLE-001` is accepted as bounded local bundle
  authority. Its decision packet is at
  [HA-ATS-SDK-BUNDLE-001](../../evidence/HA-ATS-SDK-BUNDLE-001-recommended-decision.md).
  `HA-ATS-STAGE-B-001`, `HA-PUBLIC-DEPLOY-001`, and
  `HA-B03-AGENT-PAYMENT-001` remain pending and untouched.

## Why this ruling and not another

- The SDK publishes only its root export; a browser-safe subpath does not
  exist, so the root's first alternative cannot be satisfied.
- Replacing the official SDK with a hand-encoded `deployBond` call through
  the accepted `viem` dependency would rescope M44, reopen the M44
  specification, and reproduce the 2026-06-12 factory ABI by hand. That is
  more agent time and more correctness risk than accepting one non-configuring
  import side effect whose failure mode is a build error.
- Parking M44 forfeits the tokenization track, which `D-HI-002-001` already
  priced as the cost of Stage B not landing.

## Root records

1. One human-action row `HA-ATS-SDK-BUNDLE-001` marked ACCEPTED as a bounded
   local bundle authority, naming this card and the packet.
2. One decision row `D-M44-010-006` recording the four-point ruling in the packet, superseding
   the no-mount restriction of `D-M44-010-005` only for the declared
   non-executing island mount on the `/provider/deploy` review step.
3. `M44-T010` returned from its blocked state to `20-active` for exactly one
   further bundle-gate attempt under that ruling, with the stop rule the
   packet names.
4. No change to any other human-action row.

## Explicit non-authorizations

This card authorizes no configuration bridge, durable attempt, wallet or
provider interaction, `Bond.create` call, transaction, funding, public web
deployment, video, or submission action. Execution stays behind
`HA-ATS-STAGE-B-001`.

## Human ruling

The human operator ruled GO at `2026-09-09T18:48:27Z` through the operator's delegated
session: accept the packet as written. The root recorded the human-action row,
the decision row, and the M44 reactivation from this card.
