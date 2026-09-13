# M58 verified backing record

## Goal

After the existing M56 flow receives a canonical lower-case Hedera EVM
transaction hash, the user can see whether the backing transfer is actually
confirmed. This is a durable server record, not an inference from MetaMask's
toast or a browser-only `waitForTransactionReceipt` result.

```text
accepted HEDERA_FUNDING attempt + MetaMask hash
  -> signed dashboard-session server ingress
  -> exact attempt attachment
  -> pinned Hedera Testnet observation
  -> SUBMITTED | CONFIRMED | REJECTED | OUTCOME_UNKNOWN
  -> reload-safe Back page and Backer dashboard summary
```

## Binding and verification

The web server accepts one narrow body containing a prepared-attempt public ID,
canonical transaction hash, and the existing signed intent's canonical
parameter preimage only when the request has the exact configured dashboard
origin and a valid session. It recomputes the stored canonical-parameters hash
before forwarding; the browser therefore cannot choose a different amount. Its
session signer must equal the attempt signer. The server forwards the assertion
through the existing protected provider-session ingress secret; the browser
never receives that secret.

The backend permits this route only for a `PREPARED` or identically
`SUBMITTED` `HEDERA_FUNDING` attempt whose role is `BACKER`, chain is 296, and
signer and expected target match the stored admitted command. It preserves the
first hash and rejects conflicts, then persists the hash and hash-bound tinybar
amount in a dedicated backing claim, without changing the generic ATS candidate
fields. A bounded Hedera Testnet JSON-RPC
read verifies the transaction hash, receipt success, chain, sender, target,
and exact transfer value derived from the admitted canonical parameters. It
writes `CONFIRMED` only on that evidence; unavailable or incomplete evidence
remains non-terminal and no automatic resend occurs.

## Replay and recovery

One canonical EVM transaction hash claims exactly one durable backing attempt.
The claim is stored and indexed independently from the attempt so Convex's
transactional conflict detection makes a concurrent or later attachment by a
different attempt fail closed. An identical request for the claim's original
attempt is idempotent; a different hash on that attempt is rejected. M58 does
not add timestamp binding: the bounded receipt reader deliberately reads only
the transaction and receipt documents, whose trusted block timestamp cannot be
obtained without broadening this read boundary.

Before `eth_sendTransaction`, the server durably reserves the exact attempt.
If that reservation cannot be created, the browser sends nothing. The returned
hash is then attached to that reservation before its first external read. The original
`HEDERA_FUNDING` preparation remains `PREPARED`: the backing claim alone owns
its submitted/unknown/terminal lifecycle, so it never violates ATS receipt
invariants for generic prepare attempts. An unavailable,
not-yet-observable, or unsafe response stores `OUTCOME_UNKNOWN`; an observed
contradictory/failed receipt stores `REJECTED`; an exact successful receipt
stores `CONFIRMED`. `SUBMITTED` and `OUTCOME_UNKNOWN` are rechecked through the
same authenticated reload-safe read path. Terminal states and their claims are
immutable; rechecking never sends a wallet request.

If the attachment POST is temporarily unavailable after MetaMask has returned a
hash, the browser retains that exact signed intent and hash only as a recovery
aid and offers **Attach recorded transaction** after reload. It is never a
uniqueness authority: the server-side reservation and claim are authoritative,
and this recovery path cannot send HBAR.

## Wallet/session binding

The Back page passes the canonical dashboard address, not a boolean, to its
client island. It disables preparation unless the currently connected Hedera
MetaMask account equals that address and repeats that exact equality test after
the existing pre-send account/network read. A mismatch explains the required
sign-in and sends nothing.

## Presentation

The Back page requires the same signed dashboard session to persist the hash.
It labels a stored `CONFIRMED` payment as confirmed and gives a safe HashScan
link. `SUBMITTED`/unknown is honestly pending and `REJECTED` is not backing.
The signed dashboard exposes a concise **Your backing** card for a BACKER
session: offering, amount, durable state, and safe transaction link. Campaign
and backing are separate historical projections, so either, both, or neither
may render. It never calls allocation, issues units, or treats a transfer as
allocation.

## Owned paths

- `apps/web/src/lib/backing-payment-server.ts`
- `apps/web/src/app/api/backing/payment/route.ts`
- `apps/web/src/components/backing/backing-flow.tsx`
- `apps/web/src/components/backing/backing-state.ts`
- `apps/web/src/components/dashboard/dashboard-campaign.tsx`
- `apps/web/src/lib/dashboard-campaign.ts`
- focused Web contracts for the route, state, server forwarder, and dashboard
- `packages/backend/convex/backing_payment_records.ts`
- `packages/backend/convex/provider_session_ingress.ts`
- `packages/backend/convex/schema.ts`
- `packages/backend/convex/backing_payment_claims.ts`
- `packages/backend/src/ats/hedera-funding-receipt-reader.ts`
- focused Backend contracts for admission, verification, and durable reads

Shared dashboard-session primitives, existing command relay, M56 money
calculation, command authority records, environment configuration, and wallet
transport are dependencies and are not broadened by this card.

## Safety boundary

Tests use injected fixtures only. No test needs a wallet, credentials, live
Mirror Node read, transaction, deployment, or Convex production mutation. The
route fails closed for a missing/invalid session, origin, body, configuration,
or upstream result. A hash alone is never confirmation.
