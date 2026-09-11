# Sandbox issuer onboarding design

## Decision

After a MetaMask user has completed the S38 authentication signature, Tool402
will provision one isolated **sandbox issuer** for that exact canonical wallet.
It may create its one initial v1 offering in `DRAFT` through `/provider/deploy`;
it cannot prepare ATS work, attach a candidate, publish a directory record, or
submit a transaction.

This is deliberately a new S39 follow-up, not an implicit broadening of S38.
S38 establishes authentication; S39 turns that authenticated proof into a
strictly scoped command authority. S39 cannot begin source work until S38 has
been accepted.

## Why the current manual row is insufficient

The command ingress already recovers the signer from the typed command, looks
up exactly one `commandAuthorities` record on `(296, canonicalSignerAddress)`,
and derives `principalPublicId`, `role`, and `authorityVersion` on the server.
The browser never supplies these fields. This is the correct trust boundary.

However, the present row represents an `ISSUER` that owns the shared
`riskscan_revenue_note_demo` subject. Giving every judge that same subject
would let independent wallets act on one shared offering. A row that only
sets `role: ISSUER` and a personal subject is also insufficient: the current
normalizer admits several command families for an issuer. A future valid ATS
mapping could accidentally make the personal subject eligible for an on-chain
path.

## Authority model

For canonical address `0x<40 lower-case hex>`, provisioning deterministically
derives:

| Field | Value |
| --- | --- |
| `principalPublicId` | `sandbox_issuer_<40 hex>` |
| `subjectPublicId` and initial `offeringPublicId` | `sandbox_<40 hex>` |
| `chainId` | `296` |
| `role` | `ISSUER` |
| `authorityVersion` | `sandbox_draft_v1` |
| `ownedSubjectPublicIds` | exactly `[sandbox_<40 hex>]` |
| `allowedCommandTypes` | exactly `["offering.create"]` |
| `enabled` | `true` |

`allowedCommandTypes` is an additive optional field on legacy authority rows:
absence keeps the existing explicitly provisioned operator semantics, while a
sandbox row must carry a non-empty, closed list. The ingress normalizers and
every durable admission revalidate the capability before touching an offering
or external-attempt record. No client parameter, cookie field, or command
payload can select a subject, principal, role, version, or capability.

Provisioning is idempotent for the same address. It may return the identical
already-valid sandbox row, but it must reject a missing/mismatched/duplicate
row. In particular, it must never overwrite the manually provisioned ATS
issuer record when the signed wallet happens to be that address.

## Provisioning protocol

1. S38 verifies the sealed challenge and the `personal_sign` signature.
2. Before issuing the dashboard session response, its server route sends the
   verified canonical address to a new private Convex provisioning ingress.
   First, S39 extends the Core ingress envelope from its current single literal
   to a closed path union and makes the verifier receive an expected path. The
   new endpoint is the additional literal `/internal/sandbox-issuers`; it has
   its own path-bound HMAC input and replay identity and is not callable from
   the browser. This is not an arbitrary caller-selected path.
3. The Convex internal mutation atomically finds-or-creates the deterministic
   row above. It does not accept any caller-selected authority attributes.
4. Only a successful `NEW` or exact `EXISTS` result allows S38 to set its
   `HttpOnly` dashboard session. A malformed configuration, transport failure,
   conflicting row, or invalid backend response fails closed: no session cookie
   is issued and the browser sees only a generic unavailable outcome.
5. The existing successful navigation remains `/dashboard`. The authenticated
   dashboard exposes the existing path to `/provider/deploy`; the deploy route
   reads the signed session server-side and passes the derived sandbox scope to
   its client island.

The provisioning ingress has no public route, no wallet RPC, no external
provider, no blockchain transaction, and no secret or address in a response.
Deployment configuration of the authenticated Next-to-Convex channel remains
a human-owned release action.

## Sandbox deploy experience

`/provider/deploy` becomes a signed-session route for this sandbox path. The
server derives the one subject from the session; the browser may sign a command
only if its currently connected MetaMask account equals that session address.
The command bridge receives that server-derived subject instead of the static
`riskscan_revenue_note_demo` literal.

The deploy interface keeps the existing editable offering review but clearly
labels the action **Create sandbox draft**. It permits stage 0 only. Stages 1–3
are not merely expected to fail downstream: they are unavailable in the UI and
rejected by ingress/admission even if a caller hand-crafts a signed command.
The accepted result is a durable `DRAFT` offering, not an ATS asset, directory
listing, payment instrument, or live offering.

## Explicit exclusions

- No authority is created for `riskscan_revenue_note_demo` or any ATS subject.
- No `external.prepare`, `external.attachCandidate`, or `directory.publish`.
- No ATS configuration, provider SDK, RPC, wallet switch, transaction,
  candidate attachment, publication, payment, funding, or live deployment.
- No persistent browser wallet/session storage, account/profile/balance read,
  anonymous provisioning, or generic authority-management API.

## Proof obligations

The RED/GREEN contracts must prove canonical derivation, idempotency, conflict
rejection, server-only invocation, HMAC path/replay validation, no session on
provisioning failure, session-to-wallet equality, dynamic personal subject
binding, and rejection of all three forbidden command types at both ingress and
durable-admission layers. Browser evidence must use a human-approved account
and proves only the resulting draft; it cannot claim an on-chain action.
