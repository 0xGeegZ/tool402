# HI-008 — Root sequencing request before the Stage B rehearsal

## Purpose

Human intake card. Four accepted or active records and three delivered lane
branches compete for the root's attention with fewer than three days to the
submission deadline. This card asks the root to take them in one stated order
so the on-chain rehearsal is not delayed by polish and the delivered lanes
are not left unrecorded. It authorizes no wallet, SDK, provider, transaction,
deployment, or live action and changes no card's scope.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-10
- Owner: root integrator on intake. The decision row is root-recorded.
- Human actions: none.

## Observation

- M47-T010 is `20-active` in its source-only GREEN scope. Every executable
  ATS action, and therefore HA-ATS-STAGE-B-001, waits on its acceptance.
- HI-007 is `00-inbox`. Stage B step 6, `external.attachCandidate`, needs
  the mirror-form transaction id ruling before a real candidate can be
  attached, so the ruling must land before the rehearsal.
- B03-T020 is `20-active` for its two RED paths; its GREEN unblocks the
  one-use HA-B03-AGENT-PAYMENT-001 exercise that carries the agentic-payments
  track evidence.
- Three delegated lanes are delivered and pushed with their RED and GREEN
  commits, each mirrored by a pull request for visibility only:
  S25-T010 on `work/page-header` (PR #40), S18-T010 on `work/backing`
  (PR #41), and S23-T010 on `work/entitycheck` (PR #27, after M46-T040's
  accepted commits). Their cards are `00-inbox` and STATE.md does not
  mention them.
- S22-T010 and S24-T010 are `20-active` and gated on rehearsal evidence.
  HA-PUBLIC-DEPLOY-001 and HA-DEMO-VIDEO-001 follow them.

## Requested sequence

1. M47-T010 GREEN, then its independent task and module reviews, then
   acceptance. Nothing else advances ahead of this.
2. HI-007 ruling and the M44 amendment it requests, so the rehearsal's attach
   step has a valid candidate grammar.
3. B03-T020 GREEN and acceptance, so the operator can run the bounded
   HA-B03-AGENT-PAYMENT-001 exercise once.
4. Ready review and activation of S25-T010, S23-T010, and S18-T010 from their
   delivered lane branches, in that order. The root keeps every review and
   integration decision; the lanes are input, not authority. S25's dashboard
   page migration stays deferred until S24-T010 is accepted, as its manifest
   sequences.
5. S22-T010 and S24-T010 GREEN after the rehearsal evidence, then the
   public-deployment and demo-video human actions.

## Requested root records

1. One decision row recording this sequence as the root's working order
   until HA-ATS-STAGE-B-001 is complete.
2. No change to any card's tier, dependencies, paths, or boundary.
3. No change to any human-action row.

## Explicit non-authorizations

This card authorizes no configuration bridge, durable attempt, wallet or
provider interaction, transaction, deployment, or live behavior, and it does
not move any card between queue states by itself.

## Human ruling

The human operator ruled GO on the requested sequence at the time this card
was merged, through the operator's delegated session. The root records the
decision row from this card.
