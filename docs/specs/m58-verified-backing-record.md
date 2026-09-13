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
first hash and rejects conflicts, then persists the hash and the hash-bound
tinybar amount as optional compatible fields. A bounded Hedera Testnet JSON-RPC
read verifies the transaction hash, receipt success, chain, sender, target,
and exact transfer value derived from the admitted canonical parameters. It
writes `CONFIRMED` only on that evidence; unavailable or incomplete evidence
remains non-terminal and no automatic resend occurs.

## Presentation

The Back page requires the same signed dashboard session to persist the hash.
It labels a stored `CONFIRMED` payment as confirmed and gives a safe HashScan
link. `SUBMITTED`/unknown is honestly pending and `REJECTED` is not backing.
The signed dashboard exposes a concise **Your backing** card for a BACKER
session: offering, amount, durable state, and safe transaction link. It never
calls allocation, issues units, or treats a transfer as allocation.

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
