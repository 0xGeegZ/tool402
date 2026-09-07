# M24 protected replay claim contract

## Delivery boundary

This contract adds the smallest internal adapter after the accepted M23
protected-ingress verifier. It accepts only M23's same-process verified
capability, asks one injected boundary to claim its replay identity, and returns
a new same-process capability only after that boundary reports the exact
`claimed` outcome.

The adapter neither persists a replay identity nor proves that an injected
boundary is durable, atomic, configured, or reachable. Those properties belong
to a later implementation and its own authority. This task adds no HTTP
handler, command parser, Convex function, schema, database client,
configuration source, or external action.

## Internal API

`packages/backend/src/ingress/protected-replay-claim.ts` remains internal-only
and is not re-exported from `@tool402/backend`.

```ts
export interface ClaimedProtectedReplay {
  readonly replayIdentity: string;
}

export type ProtectedReplayClaimOutcome = 'claimed' | 'already_claimed';

export type TryClaimProtectedReplay = (
  replayIdentity: string,
) => ProtectedReplayClaimOutcome | Promise<ProtectedReplayClaimOutcome>;

export async function claimProtectedReplay(
  verifiedIngress: unknown,
  tryClaimReplay: TryClaimProtectedReplay,
): Promise<ClaimedProtectedReplay | null>;

export function isClaimedProtectedReplay(
  value: unknown,
): value is ClaimedProtectedReplay;
```

`verifiedIngress` must be the exact M23 `VerifiedProtectedIngress` object
registered by `isVerifiedProtectedIngress`. A structural copy, cast, proxy, or
lookalike is not a verified capability and returns `null` before the injected
claim function is read or called.

The only injected input is the canonical M23 `replayIdentity` string. A later
implementation of `TryClaimProtectedReplay` is responsible for atomically
recording that identity in its own boundary. This adapter accepts only literal
`claimed`; `already_claimed`, malformed results, synchronous throws, and
rejected promises all return `null`.

## Claimed capability boundary

On literal `claimed`, return a frozen ordinary object with exactly one own
enumerable field, `replayIdentity`. Register that object in a module-private
`WeakSet`; `isClaimedProtectedReplay` returns true only for that exact returned
object in the current process. A copied or forged object fails membership.

This capability is local sequencing evidence only. It says an injected boundary
reported one accepted claim for the verified identity. It does not expose an
M23 key, nonce, signature, body digest, raw bytes, timestamp, durable record,
or cross-process proof of replay prevention.

## Required sequence

```text
untrusted candidate
→ M23 same-process verified membership
→ one injected replay-identity claim attempt
→ exact claimed outcome
→ frozen same-process claimed capability
```

The adapter may not parse a command, read any command field, issue another
verification, read a clock, use a local replay cache, retry the injected claim,
expose an outcome reason, or mutate other state. `already_claimed` is a normal
`null` result, not a replay acknowledgment, command result, or external
idempotency assertion.

## Scope exclusions

Do not add replay storage, a Convex schema/function/mutation/query, HTTP,
configuration, environment access, key handling, a database client, generated
output, public backend export, generic external-attempt model, command union,
payment, funding, ATS, account, wallet, signer, transaction, settlement,
clearing, HCS, payout, deployment, or a live claim. Accepted RiskScan
persistence/reconciliation records remain outside this generic internal path.

## Acceptance evidence

- A test-only RED commit precedes adapter source and observes the absent module.
- Focused tests use only a real M23 verified capability; they prove one exact
  injected identity/call, literal-outcome handling, forged/copy rejection before
  a claim attempt, frozen claimed membership, and structural-copy rejection.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before acceptance.
