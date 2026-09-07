# M25 claimed protected body contract

## Delivery boundary

This contract adds the smallest internal bridge between the accepted M23
cryptographic ingress verifier and M24 replay-claim handoff. It accepts one
untrusted closed ingress envelope plus raw bytes, makes one private byte copy,
verifies that exact copy through M23, claims its replay identity through M24,
and returns a new same-process capability only when both steps succeed.

The returned capability retains no body field. Its byte snapshot remains in a
module-private `WeakMap`; a later trusted internal caller can obtain only a
fresh copy after passing the exact same-process capability back to this module.
This prevents a claimed replay identity from later being paired with arbitrary
bytes before a separately specified command-normalization boundary exists.

This is not a command parser, wallet-signature verifier, durable replay store,
idempotency implementation, generic external-attempt model, or ATS boundary.

## Internal API

`packages/backend/src/ingress/claimed-protected-body.ts` remains internal-only
and is not re-exported from `@tool402/backend`.

```ts
export interface ClaimedProtectedBody {
  readonly replayIdentity: string;
}

export async function claimProtectedBody(
  envelopeInput: unknown,
  rawBody: Uint8Array,
  nowUnixSeconds: bigint,
  resolveKey: ResolveProtectedIngressKey,
  tryClaimReplay: TryClaimProtectedReplay,
): Promise<ClaimedProtectedBody | null>;

export function isClaimedProtectedBody(
  value: unknown,
): value is ClaimedProtectedBody;

export function readClaimedProtectedBody(
  value: unknown,
): Uint8Array | null;
```

`ResolveProtectedIngressKey` and `TryClaimProtectedReplay` remain the accepted
internal dependency types. This module does not wrap, configure, or broaden
either port.

## Required sequence

The implementation must execute this sequence and fail closed at every step:

```text
untrusted envelope + raw bytes
→ private byte copy
→ M23 verification of that exact private copy
→ M24 claim of that exact verified capability
→ frozen claimed-body capability + private byte snapshot
→ fresh byte copy only for that exact claimed-body capability
```

`rawBody` must be a `Uint8Array`. The private copy is made before M23 begins
asynchronous cryptography, and the caller's original view is never retained.
The same private copy is the only byte view passed to M23 and stored after
successful M24 claim. A failed M23 verification or M24 claim returns `null`
and creates no readable capability.

`claimProtectedBody` may not parse JSON, decode text, inspect command fields,
or derive command authority. M23 remains the sole HMAC/raw-byte/skew authority;
M24 remains the sole replay-claim sequencing authority. This module composes
those two accepted boundaries in one invocation so a body cannot be detached
from the claim it followed.

## Capability and byte-snapshot rules

On success, return a frozen ordinary object with exactly one own enumerable
field, `replayIdentity`. Register that exact object in a module-private
`WeakSet` and its private byte copy in a module-private `WeakMap`.

`isClaimedProtectedBody` returns true only for that exact returned object in
the current process. A copied, forged, proxied, or accessor-backed lookalike
must return false without reading caller-defined fields. `readClaimedProtectedBody`
returns `null` for every unregistered value. For a registered value it returns
a new `Uint8Array` copy each time, so mutating a reader result can never alter
a later read or the registered bytes.

The capability is local sequencing evidence only. It proves neither durable
storage, cross-process replay protection, command validity, wallet authority,
nor an external financial fact.

## Explicit exclusions

Do not add JSON parsing, command unions, principal/role/signer handling,
wallet signature verification, idempotency claims beyond the accepted injected
replay seam, local caches, storage, a Convex schema/function/mutation/query,
HTTP, configuration, environment access, key provisioning, a database client,
or generated output.

Do not add generic attempts, ATS/configuration, asset/account handling,
payment, funding, allocation, transfer, transaction, settlement, receipt,
clearing, HCS, payout, deployment, or live behavior. Accepted RiskScan
persistence and reconciliation records remain outside this generic path.

## Acceptance evidence

- A test-only RED commit precedes every M25 production source commit and
  observes the absent internal module.
- Focused tests use the established valid M23 envelope/key vector and prove
  exact byte preservation, one exact injected replay claim, frozen private
  membership, caller-byte mutation isolation both after completion and while
  M23 asynchronous digest work is deliberately suspended, fresh-reader-copy
  isolation, forged/copy/proxy rejection, and no body exposure after failed
  verification or claim.
- Focused tests also prove the source has no JSON parsing, storage/Convex,
  configuration, HTTP, or public backend-barrel export.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before acceptance.
