# M27-T010 — Authenticated-command authority intake

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M22-T010 accepted; M23-T010 accepted; M24-T010 accepted;
  M25-T010 accepted; M26-T010 accepted
- Owner: This is a root-owned control record only. It owns no implementation
  path. The root owns this card, the human-action record, completed decision,
  independent decision review, queue state, catalog, ownership, decisions,
  commits, and pushes.
- Human actions: HA-COMMAND-AUTHORITY-001 is accepted only as bounded
  architecture authority. It grants no wallet, provider, durable attempt, ATS,
  funding, payment, transaction, deployment, or live action.

## Scope

This record captures the smallest remaining CORE_P0 boundary after the
post-M26 source-to-runtime rescan. Existing local boundaries establish
protected byte provenance and a detached external-prepare payload vocabulary;
they do not establish an authenticated wallet command or the authority needed
to normalize one.

The human authority packet must explicitly fix all of the following without
credentials, key material, a signed payload, account setup, funded action,
deployment, or transaction:

1. the canonical signing serialization and command version/type vocabulary;
2. the permitted wallet/provider and verifier implementation;
3. the fixed chain and signer-recovery requirements;
4. the trusted signer-to-principal/role/ownership source and its failure mode;
5. command nonce issuance, expiry, and the durable replay/idempotency handoff;
   and
6. the future command type's linkage to the accepted detached payload
   boundary.

The packet must reject implicit defaults. It must not make a live action,
select a signer, create/configure an account, store a secret, or claim that a
wallet command has been verified.

The [human decision template](../../evidence/HA-COMMAND-AUTHORITY-001-template.md)
is historical checklist context only. The completed authority is recorded in
the [accepted decision](../../evidence/HA-COMMAND-AUTHORITY-001-decision.md)
and [independent review](../../evidence/HA-COMMAND-AUTHORITY-001-review.md).

## Inbox intake

At 2026-09-07T12:20:00Z, the rescan established that no authenticated-command
or generic-attempt implementation card could safely follow M26-T010. This
inbox record authorizes only the request for HA-COMMAND-AUTHORITY-001. It does
not authorize its own RED/code, JSON or raw-body decoding, command parsing,
wallet-command signature verification, principal/role lookup, replay or
idempotency storage, generic attempts, configuration, Convex, HTTP,
ATS/provider, wallet, payment, funding, transaction, deployment, or live
behavior.

A separately sourced, pure Core parser for untrusted advertised metadata may
have its own independent authority only when it consumes none of this record's
missing command, signature, principal, nonce, durable-claim, attempt, provider,
or external authority. That exception does not alter this card's scope or its
human action.

## Closure criteria

- HA-COMMAND-AUTHORITY-001 is recorded as an explicit, secret-free human
  decision with every required value above.
- A completed copy of the template is treated as input to review, not as an
  approval by default; the root must confirm that it is concrete and rejects
  all implicit defaults.
- A fresh root rescan maps that decision to a minimum local contract,
  dependencies, owned paths, negative tests, and an independent review plan.
- The root creates a new authenticated-command or generic-attempt
  implementation card only after those records are committed and reviewed.
  M27-T010 is then superseded or closed; it never moves to 10-ready or
  20-active and never authorizes implementation.

## Outcome

At 2026-09-07T18:25:00Z, the completed HA-COMMAND-AUTHORITY-001 decision fixed
the command vocabulary, typed-data domain and field order, signature and
signer grammar, server-clock rules, authority mapping, replay/idempotency
precedence, payload binding, and explicit ATS deferral. The independent review
found no Critical or Important blocker.

M27-T010 closes without entering ready or active. Its only successor is the
separately scoped M30-T010 normalizer. That successor cannot create a durable
attempt, a prepared state, an ATS intent, a provider invocation, funding
intent, wallet transaction, Hedera transaction, or other external behavior.
