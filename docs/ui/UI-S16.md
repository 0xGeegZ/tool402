# UI-S16 provider deploy wizard manifest

## Delivery boundary

No accepted surface lets a tool provider assemble an offering or authorize its
deployment. UI-S16 adds one route, `/provider/deploy`, holding the provider half
of the approved
[campaign deploy flow](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md):
a five-step wizard over one labelled `PREPARED / DEMO DATA` fixture and a review
step naming the four deployment stages and the signature each one needs.

The slice owns presentation, step state, and one frozen ATS_CREATE
configuration literal only: no wallet, provider selection, chain gate, command
builder, signature dialog, relay, canonicalizer, or durable record. Signing and
relaying belong to the
[UI-S15 wallet island and command relay manifest](./UI-S15.md); the payload
shapes belong to the
[M38 command payload contract](../specs/m38-offering-command-payloads.md) and
the accepted
[M20 offering definition schema](../specs/m20-offering-definition-schema.md).

## Local targets

The slice may add `apps/web/src/app/provider/deploy/page.tsx`, a server route
that renders the island and performs no data access, and five files under
`apps/web/src/components/provider/deploy/`: `provider-deploy-wizard.tsx` (the
client island holding step and field state), `provider-deploy-stages.tsx` (the
presentational stage list), `provider-deploy-state.ts` (the pure closed state
module), `campaign-fixture.ts` (the labelled fixture constant), and
`ats-create-configuration.ts` (the frozen ATS_CREATE configuration literal),
plus `apps/web/tests/provider-deploy-state.test.mjs` and
`apps/web/tests/provider-deploy-route.test.mjs`. It reuses the accepted tokens
and `button`, `card`, and `badge` primitives and adds no dependency, token,
stylesheet change, or icon package. It amends no accepted file and adds no
navigation link: `/provider/deploy` is reachable by direct URL until the
separately carded provider status route amends local navigation.

## Required step behavior

The wizard has exactly five steps in this order, captioned
`Step N of 5 · <label>`, the back control disabled on the first step:

| Step | Label                              | Editable                                            | Fixed and read-only                 |
| ---- | ---------------------------------- | --------------------------------------------------- | ----------------------------------- |
| 1    | Tool details                       | tool name, category, one-liner, customer problem    | —                                   |
| 2    | Interface and capability           | qualifying resource, capability summary             | capability                          |
| 3    | Pricing and target agent customers | quick price, standard price, target agent customers | —                                   |
| 4    | Funding and revenue-note terms     | use of funds, risks, acknowledgement                | terms v1 economics, note parameters |
| 5    | Review and sign                    | —                                                   | review rows, deployment stages      |

`category` is the design canvas's closed six-value selection — `security`,
`data`, `web`, `code`, `ai`, `productivity` — fixed here so no value can be
added during implementation. The capability on step 2 is fixed by the accepted
directory record schema and is rendered, never edited. The step-4 forward
control stays disabled until the acknowledgement is checked; its copy is exactly
"I confirm these are testnet, experimental terms. They promise no yield,
principal, or return. Off-platform use of the tool is not observable by
Tool402."

The step-4 economics are the accepted terms v1 values, rendered read-only in
this order: funding target 1,000 HBAR, note unit price 1 HBAR, maximum note
units 1,000, minimum purchase 10 units, revenue routing 80% operator /
20% backer reserve / 0% fee, payout cap and maturity 1,500 HBAR until
2026-12-31. No control, keystroke, or state path can change them; a material
change is a new offering version with a fresh signature, not offered here.

The two price fields take an HBAR decimal and convert to tinybars at `10^8`
before the payload is built. M38 admits both advertised prices from 1 through
10,000,000 tinybars inclusive, so 0.1 HBAR is the highest admissible advertised
price and any larger entry is refused in the browser before a signature is
requested. The fixture carries `10000000` tinybars, 0.1 HBAR, for both prices:
that is the canvas's quick value and the ceiling, and the canvas's 0.50 HBAR
standard default is above the bound and is not adopted. M38 asserts no relation
between the two prices and neither does this slice, so an equal pair is correct.

Every narrative field is refused, never trimmed, at the M38 admission bounds:
100 UTF-8 bytes for the title, 1,000 for the customer problem, 400 for each
list item, and 1 through 6 items per list. The fixture is one frozen local
constant, labelled `PREPARED / DEMO DATA` wherever its values are visible, and
is the wizard's only initial content; the wizard performs no fetch, storage
read, or configuration read on load or on any step change.

The revenue-note parameter card on step 4 and the target and
`canonicalParametersHash` of the second stage render only values from an
injected ATS_CREATE configuration projection: note name, symbol, ISIN, unit
count, nominal value and currency, decimals, whitelist and controllable flags,
and factory and resolver identifiers. That projection is the frozen literal
`ats-create-configuration.ts`, transcribed from the sibling retarget values —
`network`, `chainId`, `subjectPublicId`, `offeringVersion`, `registryRevision`,
`operationKind`, `targetKind`, `expectedTarget`, `canonicalParametersHash`,
`factoryHederaId`, and `resolverHederaId` — and asserted field for field
against the
[M42 ATS_CREATE configuration retarget](../specs/m42-ats-create-configuration-retarget.md)
by a focused test. No other file in the slice carries an address, registry
revision, configuration identifier, or digest, and the wizard reads those
values only through the injected projection; with none supplied those rows and
that stage read as not configured and nothing is displayed in them. The literal
is a static module import, not a runtime configuration read.

## Required stage behavior

The review step lists exactly four stages in this order, each with its own
control: 1 "Record the draft offering", signing `offering.create`; 2 "Prepare
asset creation", signing `external.prepare` with kind `ATS_CREATE`; 3 "Create
the revenue note", which has two sub-steps — the separately carded ATS SDK
action creates the note in MetaMask and returns a candidate, then this slice
signs `external.attachCandidate` with that candidate's `transactionId` and
`evmAddress`; the SDK action signs nothing, and the verification of the
attached candidate is separately carded and this slice asserts nothing about
it; 4 "Publish to the Tool Directory", signing `directory.publish`. No stage is
actionable before its predecessor has closed.

Each stage state is a closed union of exactly ten kinds:

```text
blocked | actionable | in_progress | done | unavailable
unsupported_type | rejected | replayed | conflict | unknown
```

The signature dialog's own phases belong to UI-S15; `in_progress` is only this
stage's reading while that dialog is open and duplicates none of them.

The relay outcomes map onto it and nothing else: `ACCEPTED` to `done`,
`UNSUPPORTED_TYPE` to `unsupported_type`, `REJECTED` to `rejected`, `REPLAYED`
to `replayed`, `CONFLICT` to `conflict`, the relay's `not_configured` to
`unavailable`, and its `transport_failure` and `unexpected_response` to
`unknown` because the command may already have been admitted.
`UNSUPPORTED_TYPE` is transport-only, naming a command type with no enabled
dispatch entry; authority refusals arrive reason-free as `REJECTED`, so a
rejected stage says the server gave no reason and names the possible causes
without asserting one. A declined signature returns the stage to `actionable`
and states that nothing was recorded. Stage 3 is `unavailable` while the ATS SDK
action or the projection is absent, and nothing retries automatically.

Each chip carries one fixed status word per kind — `blocked` `Blocked`,
`actionable` `Needs signature`, `in_progress` `Awaiting signature`, `done`
`Done`, `unavailable` `Stage B · human`, `unknown` `Outcome unknown`,
`unsupported_type` `Unsupported type`, `rejected` `Rejected`, `replayed`
`Replayed`, `conflict` `Conflict` — so the distinction survives without colour,
using the accepted tokens only and no separately carded tone vocabulary. The
offering-state chip shows `NOT STARTED` and never an offering state: no relay
outcome carries one and this slice performs no read. The separately carded
provider status route is the only surface that reports `DRAFT`,
`ASSET_PENDING`, `READY`, `OPEN`, or `CLOSED`.

## Truthfulness and authority boundary

Stage state is derived only from outcomes this browser session received. It is
not persisted, a reload returns every stage to its resting kind, and the wizard
says so and names the separately carded provider status route as authoritative.
A stage detail line renders only a value a relay outcome actually returned in
this session; the design canvas's sample attempt ids, transaction ids, account
ids, asset addresses, and elided digests are illustrative and never rendered.
Advertised prices are display amounts: the live 402 challenge remains the only
payment authority. A wallet callback is never success, and the third stage
reaches `done` only from a reported verified record this slice never asserts.

The slice creates and sends no offering, attempt, asset, directory version,
payment, or transaction, holds no key or secret, reads no environment value,
adds no session, storage, cookie, analytics, polling, or external link, and
claims nothing live, deployed, funded, paid, issued, or verified.

## Acceptance evidence

- Focused contracts cover the five steps and their exact field sets, the closed
  category selection, the acknowledgement gate, the read-only economics under
  every state path, the HBAR-to-tinybar conversion, and the refusal of a price
  or narrative field outside its M38 bound.
- Focused contracts cover the closed ten-kind stage union, the relay outcome
  mapping, the predecessor ordering, the two sub-steps of stage 3 whose second
  one signs `external.attachCandidate` with the returned candidate, the
  rejected-stage copy that asserts no cause, the declined-signature return to
  `actionable`, the absence of automatic retry, and the not-configured readings
  with no projection.
- A focused contract asserts the frozen ATS_CREATE configuration literal field
  for field against the M42 retarget values, `canonicalParametersHash`
  included.
- A focused route contract proves the route renders the labelled fixture with no
  fetch, storage, configuration, or environment read, and no sample identifier,
  digest, account, or balance.
- Browser checks cover step navigation, the disabled forward control, visible
  keyboard focus, the polite live region on stage outcomes, and no horizontal
  overflow at narrow widths; no connected-wallet, signed-command, or backend
  claim is made.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the local guard, and independent review pass first.
