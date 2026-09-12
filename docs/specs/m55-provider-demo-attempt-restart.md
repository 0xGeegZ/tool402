# M55 provider demo attempt restart

## Outcome

An issuer may explicitly start a fresh Provider demo attempt after an
interrupted or mistaken recording. The action never clears, cancels, deletes,
or rewrites an accepted offering, prepared attempt, candidate, or Directory
version.

## Problem

The current Provider flow has one fixed RiskScan subject. M51 can resume one
`ASSET_PENDING` offering, but its Stage 2 admission links the unique unlinked
`DRAFT` offering for that fixed subject. Merely changing `offeringPublicId` in
the browser would allow two unlinked drafts to exist and make the next Stage 2
link ambiguous. A UI-only reset would also misrepresent already durable or
on-chain facts.

## Design

1. A user click on **Start a new demo attempt** creates one server-generated,
   immutable attempt identity before any wallet signature. The initial durable
   record is only an attempt allocation; it is not an offering, authority,
   signature, transaction, or Directory publication.
2. The browser routes to that selected attempt. A reload resumes the same
   selected attempt and never allocates another one implicitly.
3. Every signed command is bound to the selected attempt. The Stage 2 binding
   must select the matching attempt's offering explicitly, rather than finding
   an arbitrary `DRAFT` by the fixed subject.
4. A new attempt receives its own offering public identity and Directory
   version namespace. Earlier attempts remain immutable and inspectable. A
   new attempt cannot silently overwrite an active Directory listing.
5. The deploy wizard shows the current attempt and exposes the action only
   through a confirmation dialog. The dialog says that previous signed or
   published records remain unchanged. The Provider dashboard may link to
   attempt history, but it does not own the reset action.

## Invariants

- Allocation is explicit, one click creates at most one attempt, and duplicate
  clicks return the same pending allocation rather than two attempts.
- No refresh, route visit, wallet event, or resume read creates an attempt.
- Existing command replay remains scoped to its attempt; cross-attempt replay
  is a conflict.
- Public reads expose only the selected attempt's safe projection and prior
  attempt summaries needed for the demo. They never expose durable IDs,
  authority data, signatures, secrets, or candidate payloads.
- Creating, signing, relaying, transacting, candidate attachment, verification,
  deployment, and Directory publication remain independently gated exactly as
  before.

## Required predecessor and scope boundary

M51 currently owns the read-only resume files and is `20-active`. M55 cannot
start a RED or source change until M51 has completed its own final review and
released that reservation. M55 also needs a new authenticated allocation
boundary: an unauthenticated browser route must not create unlimited durable
attempt rows merely because a wallet is connected.

The first M55 implementation plan must select and document the allocator's
authorization mechanism before source changes. It may not weaken the existing
issuer, replay, or Stage B gates to make the demo flow convenient.

## Acceptance

- One confirmed click allocates exactly one fresh durable attempt; a duplicate
  click and a reload allocate none further.
- A selected attempt reloads and resumes without a wallet request or signature.
- Stage 1 and Stage 2 bind only that attempt's offering and cannot become
  ambiguous when a prior attempt is `DRAFT`, `ASSET_PENDING`, `READY`, or
  `OPEN`.
- Earlier attempts and their Directory records are readable and unchanged.
- Focused contracts cover allocation, duplicate click, reload/resume,
  cross-attempt replay/conflict, attempt-specific Stage 2 binding, and the
  single-active-listing boundary.
