# M27-T010 — Authenticated-command authority intake

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M22-T010 accepted; M23-T010 accepted; M24-T010 accepted;
  M25-T010 accepted; M26-T010 accepted
- Owner: This is a root-owned control record only. It owns no implementation
  path. The root owns this card, the human-action record, queue state,
  catalog, ownership, decisions, commits, and pushes.
- Human actions: HA-COMMAND-AUTHORITY-001 is required before any future
  implementation card is created.

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

## Inbox intake

At 2026-09-07T12:20:00Z, a fresh rescan confirmed that no source-compatible
implementation card can safely follow M26-T010 yet. This inbox record
authorizes only the request for HA-COMMAND-AUTHORITY-001. It does not
authorize RED/code, JSON or raw-body decoding, command parsing, wallet-command
signature verification, principal/role lookup, replay or idempotency storage,
generic attempts, configuration, Convex, HTTP, ATS/provider, wallet, payment,
funding, transaction, deployment, or live behavior.

## Closure criteria

- HA-COMMAND-AUTHORITY-001 is recorded as an explicit, secret-free human
  decision with every required value above.
- A fresh root rescan maps that decision to a minimum local contract,
  dependencies, owned paths, negative tests, and an independent review plan.
- The root creates a new implementation card only after those records are
  committed and reviewed. M27-T010 is then superseded or closed; it never
  moves to 10-ready or 20-active and never authorizes implementation.
