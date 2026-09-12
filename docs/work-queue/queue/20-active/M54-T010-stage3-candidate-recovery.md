# M54-T010 — Stage 3 candidate recovery and closed relay feedback

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M53-T010's fixed-Factory receipt selection is co-reviewed in
  this branch. M51-T010, S26-T010, S36-T010, and B04-T010 do not grant any
  additional behavior outside the exact paths below.
- Owner: root owns the card, specification, queue records, reviews,
  integration, commits, and pushes. The exact source and test paths below are
  active; no other path is reserved.
- Human actions: no wallet request, signature, relay, transaction, attachment,
  deployment, configuration, or public-network proof is required for local
  delivery. Any later real-browser action remains human-owned.

## Purpose

When a confirmed Stage-B transaction has a public hash but its session-local
candidate is lost after reload, the Provider screen must offer one explicit,
read-only recovery path. It must revalidate the public evidence before it can
again expose the separately clicked attachment signature. A closed relay
outcome must remain visible after the signature dialog closes.

## Local specification

The minimum contract is
[`M54 Stage 3 candidate recovery`](../../../specs/m54-stage3-candidate-recovery.md).

## Candidate source and test boundary

The active correction reserves only these paths:

- `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`;
- `apps/web/src/components/provider/deploy/ats-create-action.tsx`;
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`;
- `apps/web/src/components/provider/deploy/provider-deploy-state.ts`;
- `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`;
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`;
- `apps/web/tests/ats-create-action.test.mjs`;
- `apps/web/tests/deploy-stage-signing.test.mjs`; and
- `apps/web/tests/provider-deploy-state.test.mjs`.

M54 does not own the command relay, signature dialog, backend dispatch,
attachment mutation, offering projection, storage, configuration, package, or
lockfile paths. Stage 4 durable continuation is a separate successor after
M51 and is excluded.

## Acceptance requirements

- Recovery starts only from an explicit user click with a canonical public
  transaction hash. It never sends a transaction, requests an account, signs,
  relays, attaches, stores browser data, or runs automatically on mount.
- The bridge must revalidate the fixed chain, issuer, Factory, successful
  receipt/event, Mirror transaction identity, and normalized candidate before
  returning a candidate. Invalid, pending, foreign, malformed, or ambiguous
  public evidence stays unadvanced.
- The existing separate attachment signature remains the only path to an
  attachment request.
- `not_configured` remains a precise no-forward/no-record terminal fact after
  dialog dismissal. `transport_failure` and `unexpected_response` remain
  unknown and cannot cause an automatic retry or signature.
- Focused injected-fake RED/GREEN tests, Web typecheck/lint, queue/reference/
  whitespace checks, a non-signing local browser check, and independent task,
  specification, and standards reviews are required before acceptance.
