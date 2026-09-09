# HI-007 — Candidate transaction id wire form intake

## Purpose

Human intake card. Two accepted or active contracts disagree on the lexical
form of the ATS_CREATE candidate transaction id, and the disagreement would
make the S21 stage 3 request throw on a real candidate. This card asks the
root to settle the wire form with one bounded amendment. It authorizes no
wallet, SDK, provider, transaction, deployment, or live action.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-09
- Owner: root integrator on intake. The decision row is root-recorded.
- Human actions: none.

## Observation

- The accepted M38 `parseAttachCandidatePayload` admits exactly two forms:
  the canonical `0.0.N@seconds.nanos` form of the M10
  `parseHederaTransactionId` grammar, whose nanosecond group is `0` or a
  digit string without a leading zero, and the mirror `0.0.N-seconds-nanos`
  form whose nanosecond group is exactly nine digits. It converts nothing.
- The active M44 specification lets a candidate `transactionId` take either
  the `@` form or the `-` form as the SDK returns it. The Hedera SDK renders
  the `@` form with the nanosecond group zero-padded to nine digits, for
  example `0.0.9213391@1789430400.000000001`. That string satisfies neither
  M38 branch: the `@` branch rejects the leading zeros and the `-` branch
  requires hyphens.
- S21's bridge passes the candidate through verbatim and the M38 parser
  throws, so a real candidate would leave stage 3 with no request.

## Requested ruling

Settle the wire form in M44 rather than by widening accepted Core: M44's
client normalizes every candidate to the mirror form
`0.0.N-seconds-NNNNNNNNN` (nine-digit nanoseconds, zero-padded) before it
returns `{ kind: "candidate" }`, and the M44 specification and RED contract
say so. M38, M43, and S21 stay byte-unchanged. A response whose transaction
id cannot be normalized into that form is `submission_unknown`, as the M44
specification already provides for a malformed response.

## Basis for preferring this over a Core change

- Mirror Node addresses transactions by the hyphenated form, which is the
  form M43 will query, so normalizing at the source removes a second
  conversion later.
- The M10 and M38 grammars are accepted and reviewed; a widening would reopen
  their RED contracts and every consumer.
- M44 is active and its candidate normalization is already the point where
  the SDK response is validated.

## Requested root records

1. One decision row recording the mirror-form ruling and the M44 amendment.
2. The M44 card and `docs/specs/m44-ats-issuer-client-seam.md` amended so the
   candidate grammar is the mirror form only, with a RED vector for the
   zero-padded `@` input.
3. No change to any human-action row.

## Explicit non-authorizations

This card authorizes no configuration bridge, durable attempt, wallet or
provider interaction, transaction, deployment, or live behavior.

## Human ruling

The human operator ruled GO on the requested ruling at the time this card was
merged, through the operator's delegated session. The root records the
decision row and the M44 amendment from this card.
