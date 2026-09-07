# M31 external-prepare command admission handoff

## Delivery boundary

This contract adds the smallest same-process boundary after accepted M30
normalization. It accepts one M25 claimed body and the same injected
normalizer dependencies used by M30, then passes only a fresh frozen snapshot
of a successfully normalized command to one injected atomic-admission
boundary.

M31 does not implement storage, prove durability, create a replay claim,
create a generic attempt or `PREPARED` state, resolve ATS targets or
parameters, invoke a provider, or make any external action. The injected
boundary is the sole future owner of atomic replay/idempotency persistence;
this adapter does not split it into claim and write callbacks.

The card exists because an arbitrary structural
`NormalizedExternalPrepareCommand` cannot be treated as authenticated input.
M31 must invoke M30 itself from an M25 claimed body before it can hand a
detached value to the injected boundary.

## Internal API

`packages/backend/src/ingress/external-prepare-command-admission.ts` remains
internal and is not exported from `@tool402/backend`.

```ts
export type ExternalPrepareAtomicAdmissionStatus =
  | "NEW"
  | "COMMAND_REPLAYED"
  | "IDEMPOTENCY_REPLAYED"
  | "IDEMPOTENCY_CONFLICT";

export interface ExternalPrepareAtomicAdmission {
  readonly version: 1;
  readonly type: "external.prepare";
  readonly chainId: 296;
  readonly canonicalSignerAddress: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly replayIdentity: string;
  readonly principalPublicId: string;
  readonly role: CommandAuthorityRole;
  readonly authorityVersion: string;
  readonly payload: ExternalPreparePayload;
}

export interface ExternalPrepareAtomicAdmissionResult {
  readonly status: ExternalPrepareAtomicAdmissionStatus;
}

export type AtomicallyAdmitExternalPrepareCommand = (
  admission: ExternalPrepareAtomicAdmission,
) => ExternalPrepareAtomicAdmissionResult;

export async function admitClaimedExternalPrepareCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: ResolveCommandAuthorities,
  atomicallyAdmit: AtomicallyAdmitExternalPrepareCommand,
): Promise<ExternalPrepareAtomicAdmissionResult | null>;
```

`CommandAuthorityRole`, `ExternalPreparePayload`, and
`ResolveCommandAuthorities` are imported only from the accepted internal M30
and M26 boundaries. This file exports no public package API.

M31 deliberately accepts only a synchronous direct result. It does not inspect
or await any `Promise` or thenable. A later separately reviewed durable
persistence card must define any asynchronous capability and its provenance;
this injection-only seam makes no such claim.

## Required sequence

```text
untrusted claimedBody / injected dependencies
→ verify atomicallyAdmit is callable
→ M30 normalizeClaimedExternalPrepareCommand
→ fresh frozen M31 admission snapshot
→ exactly one injected atomic-admission invocation
→ direct closed status or null
```

If `atomicallyAdmit` is not callable, return `null` before M30 reads the
claimed body, resolves an authority, or performs signature work. If M30
returns `null`, do not invoke the atomic boundary. If the injected boundary
throws, returns a promise or thenable, returns a non-ordinary/accessor-backed/
extra-field result, or returns any status outside the four exact literals,
return `null` without a retry.

The implementation validates the direct result through descriptor-safe
reflection only. It must not use `await` on the boundary outcome,
`Promise.resolve`, direct `.then`, `instanceof`, native-Promise internals, or
any other asynchronous or structural-trust path. Every promise and thenable form, including a direct
thenable, native promise, proxy-wrapped promise, species-poisoned promise, and
delayed-thenable fulfillment, returns `null` without probing or invoking its
`then`. Each such candidate still consumes its one permitted boundary call; the
adapter does not retry it.

The adapter invokes the boundary at most once. It must neither retry an
outcome-unknown condition nor convert a failed boundary call into a replay,
idempotency, or success result.

## Atomic-boundary contract

The injected boundary receives exactly the detached snapshot above. It is a
future persistence contract, not an M31 implementation claim. Its eventual
durable implementation must apply these already accepted rules atomically:

1. re-read the current durable signer authority and require the matching
   enabled principal, role, ownership, and authority version;
2. evaluate the exact command replay identity before any idempotency lookup;
3. return `COMMAND_REPLAYED` for an already claimed replay identity without
   creating or invoking another operation;
4. for a fresh replay identity, resolve the M26 idempotency key using exact
   payload hash plus the exact command context tuple
   `(version, type, chainId, canonicalSignerAddress, principalPublicId, role,
   authorityVersion, payloadHash)`;
5. return `IDEMPOTENCY_REPLAYED` only for equal payload hash and context, and
   return `IDEMPOTENCY_CONFLICT` for any mismatch; and
6. only a `NEW` outcome may eventually record the new replay identity
   and one future generic attempt.

M31 does not assert that an injection actually provides atomicity or durable
storage. A later separately reviewed persistence card must define its schema,
transaction, records, and independently verifiable runtime evidence.

## Snapshot and result requirements

The object passed to `atomicallyAdmit` has exactly the declared own enumerable
data fields, a normal object prototype, and is frozen. Its nested M26 payload
is the accepted frozen payload from M30; it contains no raw body, raw
signature, provider, resolver record, target resolution, parameter
authorization, key, or external capability.

The adapter return value is a new frozen ordinary object with exactly one own
enumerable `status` field. It is not an attempt, receipt, durable proof,
payment fact, or external authorization.

An accepted direct injected result has the normal `Object.prototype`, exactly
one own key named `status`, and an enumerable data descriptor whose value is
one of the four exact status literals. Every reflective operation is
fail-closed; accessors, extra string or symbol keys, custom/null prototypes,
or hostile reflection return `null`. The contract does not infer trust from an
`instanceof` check or a caller-owned method.

## Explicit exclusions

Do not add Convex schema/query/mutation/action, a cache, database client,
public endpoint, browser provider, wagmi, wallet call, configuration or
environment access, `PREPARED` state, generic attempt, replay/idempotency
storage, ATS target or parameter authority, ATS/provider SDK, funding,
payment, transaction, settlement, clearing, HCS, payout, deployment, or live
evidence. Do not modify M24 through M30 or reopen M04 RiskScan persistence or
reconciliation.

## Acceptance evidence

- A test-only RED commit precedes the M31 source file and observes its absence.
- Focused tests prove non-callable injection rejection before M30, M30-only
  authentication (no arbitrary normalized DTO), one frozen detached snapshot,
  one injection call, all four exact status mappings, malformed/hostile
  result rejection, strict synchronous-only result handling (including a
  direct thenable, native promise, proxy-wrapped promise, species-poisoned
  promise, and delayed-thenable fulfillment), thrown injection isolation
  without retry, and absence of Convex/provider/storage/external behavior.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before
  acceptance.
