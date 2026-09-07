# HI-001 — Demo contract realignment and live-evidence intake

## Purpose

Human intake card. Record a scope question and four externally verified facts that the local queue does not yet hold, so the root can decide the remaining delivery shape against the real submission deadline. This card requests a decision and new human-action rows; it accepts no product behavior and authorizes no external action.

## State

- Tier: intake
- Queue state: 60-done
- Raised by: human operator, 2026-09-06
- Owner: root integrator on intake; the scope decision is human-owned and is now recorded.

## Scope

### 1. Scope question: the funding half of the judged narrative has no local presence

The preparation-repository demo narrative describes a judged path of offering, backer funding and asset allocation, directory-led agent paid task, verified revenue split, audit event, holder snapshot, capped payout, and backer position. The public thesis attached to that narrative is a funding proposition.

This repository currently records no specification, card, or source for the funding, offering, backer, allocation, split, snapshot, payout, or audit-event stages. A search for those terms across `docs/specs` returns one negative mention only. The delivered modules cover discovery, the assessment contract, durable request and settlement persistence, the agent tool loop, and the presentation surface.

The intake question is therefore not "when does funding land" but "is the funding half in scope at all for this event". Both answers are legitimate; the local records do not currently reflect either as a decision. A recorded scope decision in the shape of the existing assurance cut would remove the ambiguity.

### 2. Externally verified facts the local records do not hold

Each fact below was checked against a primary source on 2026-09-06 and supersedes an older preparation-repository snapshot dated 2026-09-01.

**Submission deadline.** The official event details page states that all projects must be submitted by Sunday 2026-09-13 at 12:00 EDT. Preparation material describes the event as running to 2026-09-16. The working horizon is therefore about seven days, not ten.

**Demo video length.** The official event details page requires a two-to-four minute video and states that videos under two or over four minutes are rejected automatically. Individual partner tracks state "five minutes or less". The event-wide rule is the binding constraint. Preparation material that records a five-minute allowance would produce a rejected submission if followed.

**Partner track requirements.** The live prize page lists three relevant partner tracks. The agentic-payments track requires a live x402-gated service on testnet or mainnet settled through the named facilitator, a platform or agent completing at least one real paid request end to end, a public repository with a README covering setup, architecture, and payment flow, and a demo video. The tokenization track requires the Asset Tokenization Studio to issue or manage a tokenized asset, deployment demonstrated on testnet, a public repository, and a video showing issuance, configuration, and at least one lifecycle operation. The remaining partner selection is a continuity track that requires prior existence of the project and does not fit a clean implementation repository.

**Facilitator capability is live and matches the accepted local contract.** The designated facilitator's public capability endpoint responds successfully and advertises `x402Version: 2`, scheme `exact`, network `hedera:testnet`, and a fee-payer account. This is the exact advertised capability shape that the accepted M06 contract requires before its native branch may issue a challenge. No credential or signup was required to read it. The canonical testnet asset identifier for the stablecoin named in partner material is also publicly documented.

The practical consequence is that the accepted local Hedera configuration family appears to have a real counterpart available now. The remaining gap on the payment path is human configuration and a funded payer, not further local contract work.

### 3. Human-action coverage gap

`HUMAN-ACTIONS.md` holds one row, and that row records that it unblocks nothing. The externally verified requirements above imply at least the following additional human-only actions, none of which is currently tracked: repository visibility for public submission; a hosted public deployment of the gated service; the recorded scope decision in item 1; tokenized-asset issuance, configuration, and one lifecycle operation if that track is selected; an audit-topic creation if an audit trail is claimed; the human-narrated demo video; and the submission itself.

An untracked human action cannot be scheduled and cannot block a card. Several of these have lead times that exceed the remaining horizon if they are discovered late.

## Acceptance criteria

1. The root records the funding-scope question as an explicit decision with a stated cut or go, using the established local decision format, before further module sequencing depends on it.
2. The four externally verified facts are reflected wherever local records currently carry a superseded date, length, or event-window value.
3. `HUMAN-ACTIONS.md` gains a row for each human-only action implied by the selected scope, each naming the evidence that would complete it and the cards it unblocks.
4. The verified facilitator capability is recorded as an observation only. No card treats it as authorization to configure, fund, sign, submit, or deploy anything.

## Validation

- The recorded decision names the selected scope and the cost if it is wrong.
- No local document continues to assert a submission window or video length that contradicts the primary sources checked on 2026-09-06.
- Each new human-action row is distinguishable as pending, in progress, or complete by its recorded evidence alone.
- The local reference guard passes and no credential, key, account secret, or funded material enters the repository.

## Boundary

This card records a question, four external observations, and a coverage gap. It does not select a scope, mark any human action complete, authorize account creation, funding, signing, deployment, publication, or submission, or claim that any payment, transaction, asset, deployment, or evidence record exists. Every external action named here remains human-authorized and unperformed.

## Resolution

The human operator ruled CUT at 2026-09-07T17:18:56Z. The funding half of the
demo narrative is out of scope for this event, and the repository commits to
the agentic-payments path alone. The ruling, its basis, and its cost if wrong
are recorded as `D-HI-001-001` in [the runtime decisions](../../DECISIONS.md).

Each acceptance criterion is discharged as follows.

1. The scope decision is recorded as `D-HI-001-001` with an explicit CUT and a
   stated cost if wrong.
2. The four external observations are adopted as `D-HI-001-002`. A
   repository-wide search found no tracked record asserting the superseded
   event window or the superseded five-minute video length, so no existing
   document required correction. One superseded claim was found in this card
   itself and is corrected immediately below.
3. [The human actions record](../../HUMAN-ACTIONS.md) gains
   `HA-REPO-VISIBILITY-001`, `HA-PUBLIC-DEPLOY-001`, `HA-DEMO-VIDEO-001`, and
   `HA-SUBMISSION-001`. Under the recorded CUT no ATS, audit-topic, funding,
   allocation, snapshot, or payout row is created.
4. The facilitator capability is recorded in `D-HI-001-002` as a read-only
   observation only. No card treats it as authorization to configure, fund,
   sign, submit, or deploy.

### Correction to this card

Scope item 1 states that the repository records no specification, card, or
source for the funding stages. That was accurate when this card was raised on
2026-09-06 and is superseded. M16 and M17 were accepted on 2026-09-06, and M18
through M21 were accepted on 2026-09-07, after this card was written. Offering
terms and revenue math, allocation, remaining payout capacity, clearing-split
calculation, the offering purchase, paid-task, and clearing-split lifecycles,
the offering definition schema, and the requirements-bound offering quote all
exist in the Core package.

The card's conclusion nevertheless holds, for a different reason. Those modules
are referenced only by their own type tests: no route, persistence, surface, or
agent path consumes any of them. Backer, holder-snapshot, audit-event, and
payout execution have no local source at all. The funding half therefore has
domain math without a delivery surface, and the stages that would carry the
judged narrative do not exist.
