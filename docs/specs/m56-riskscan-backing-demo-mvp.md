# M56 RiskScan backing demo MVP

## Proposed delivery boundary

M56 proposes a narrow successor to accepted S18: one already-admitted, OPEN
RiskScan campaign may become actionable through a server-owned projection and
an explicit server configuration treasury. No product source or executable
contract is reserved by this intake.

The proposed result is deliberately only this sequence:

```text
OPEN RiskScan offering -> Back this tool -> HEDERA_FUNDING signature
-> one explicit MetaMask HBAR submission -> transaction hash
-> Payment submitted / Allocation pending
```

No returned wallet hash is confirmation, settlement, allocation, token
ownership, or a contribution record. There is no persistence, capacity
reservation, verifier, refund, payout, token action, automatic retry, or
external candidate attachment in this card.

## Proposed controls

The active RED contract may establish the missing projection and presentation
boundaries before implementation. It must retain S18's bigint money
calculation, one user-clicked transfer, fresh account/chain read, shared
signature/relay path, canonical transaction hash display, no automatic retry,
and the truthful allocation-pending terminal state.

## Authoritative projection and configuration

`apps/web/src/lib/riskscan-backing-projection.ts` is the sole server-side
adapter for this slice. It calls `readProviderProjections` with the existing
`riskScanOfferingPublicId`, and returns a backing projection only when the
offering is loaded, its public ID and subject ID equal that canonical ID, its
state is exactly `OPEN`, its signer is canonical, its terms are accepted by the
existing reader, and `TOOL402_FUNDING_EVM_ADDRESS` is an own primitive
environment value matching one lower-case EVM address. It otherwise returns
`null` and never derives a treasury from a browser, issuer, ATS Factory, x402
recipient, or converted Hedera account.

## Backing interaction

The existing S18 state contract remains the transfer authority and additionally
requires `OPEN` before the form becomes actionable. Its bigint
units/tinybar/weibar arithmetic, HEDERA_FUNDING preimage, shared wallet
session, SignatureDialog, relay, account/chain re-read, and one-send lock are
preserved.

The detail renders one server-projected `Back this tool` entry only for an OPEN
projection. The backing route shows fixed 10, 50, and 100-unit candidates only
when each lies within the offering's exact bounds, plus the existing custom
input and a four-step rail. A canonical lower-case hash remains
`payment_submitted` and is shown as `Payment submitted — allocation pending`;
it does not claim confirmation, settlement, allocation, or ownership. A
missing hash or ambiguous outcome remains `payment_outcome_unknown` with no
automatic resend.

## Owned paths

- `apps/web/src/lib/riskscan-backing-projection.ts`
- `apps/web/tests/riskscan-backing-projection.test.mjs`
- `apps/web/src/app/explore/riskscan/back/page.tsx`
- `apps/web/src/components/backing/backing-flow.tsx`
- `apps/web/src/components/backing/backing-state.ts`
- `apps/web/src/components/backing/backing-presentation.ts`
- `apps/web/src/components/backing/backing-step-rail.tsx`
- `apps/web/src/app/explore/riskscan/page.tsx`
- `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`
- `apps/web/tests/backing-route.test.mjs`
- `apps/web/tests/backing-state.test.mjs`
- `apps/web/tests/backing-presentation.test.mjs`
- `apps/web/tests/riskscan-detail.test.mjs`

`apps/web/src/lib/offering-projection.ts`, the wallet session, SignatureDialog,
relay, command admission, and runtime authority provisioning remain shared
dependencies and are not modified by M56.

## Verification

The RED contract at `2a6e38fa` records eleven intended failures and eight
unchanged passes against an implementation-free archive. GREEN runs focused
and full Web tests, typecheck, lint, queue/reference/whitespace checks, a
supported production build, desktop and 390px browser checks, and independent
review.

## Human and runtime boundaries

Human Ops alone may configure the treasury, provision the dedicated chain-296
BACKER authority for HEDERA_FUNDING, connect the wallet, sign, send HBAR,
deploy, or demonstrate a live payment. This intake neither reads a secret nor
performs any of those actions.
