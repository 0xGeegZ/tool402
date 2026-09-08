# M34-T010 — ATS configuration authority intake

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M16-T010 accepted; M20-T010 accepted; M32-T010 accepted;
  M33-T010 accepted
- Owner: This is a root-owned control record only. It owns its card, the
  secret-free recommended and accepted decision records, independent review,
  human-action record, queue state, catalog, ownership record, decisions,
  commits, and pushes. It owns no implementation path.
- Human actions: HA-ATS-CONFIGURATION-001 is accepted only for a local
  unsigned boundary implementation card. It is architecture/configuration
  authority only and authorizes no provider, wallet, account, funding, payment,
  transaction, deployment, or live action.

## Scope

The post-M33 source-to-runtime rescan found that the next ATS source slice
cannot truthfully become a local implementation card yet. Local offering and
durable-attempt boundaries exist, but intentionally do not define an ATS SDK
version, issuer role, factory/resolver configuration, immutable asset
configuration, target, or operation parameters. M33 correctly keeps its
production manifest zero-enabled and rejects every current `ATS_*` payload.

This card requests exactly one complete, secret-free decision packet for a
future narrow ATS boundary. The recommended first capability is `ATS_CREATE`
only. It must not implicitly authorize `ATS_CONTROL_LIST`, `ATS_ISSUE`,
`ATS_TRANSFER`, or `ATS_COUPON`.

The [recommended human decision packet](../../evidence/HA-ATS-CONFIGURATION-001-recommended-decision.md)
is intentionally prefilled with the safest D-Day defaults. The human must
supply every remaining exact public configuration value. It is not an approval
until the completed packet is explicitly accepted and independently reviewed.

## Inbox intake

Recorded at 2026-09-08T08:35:19Z after a fresh source-to-runtime critical-path
rescan at pushed `59929eb363c9bc1db82364b61fa502a4283c2b32`. M16-T010,
M20-T010, M32-T010, and M33-T010 are accepted. No active lane, ownership
conflict, local-reference issue, or guard issue exists. The rescan found no
other dependency-correct local funding, clearing, holder-distribution, HCS, or
ATS-compliance card: each would either require this missing authority or an
independently verified financial predicate not yet represented locally.

This control record authorizes only preparation, review, and recording of
HA-ATS-CONFIGURATION-001. It does not authorize RED/code, an SDK dependency,
configuration provisioning, an enabled M33 record, Convex publication,
HTTP/BFF behavior, provider or wallet interaction, account action, funding,
payment, transaction, allocation, clearing, HCS, payout, deployment, or live
evidence.

## Closure criteria

- HA-ATS-CONFIGURATION-001 is recorded as an explicit, secret-free human
  decision that supplies every configuration field required by its packet and
  rejects all implicit defaults.
- The packet authorizes at most one immutable `ATS_CREATE` configuration and
  preserves M33's zero-enabled production manifest. No local unsigned
  successor may enable it; any enabled mapping requires both a later explicit
  human execution gate and a separately reviewed source revision.
- A fresh root rescan maps the completed decision to the smallest local
  contract, dependencies, owned paths, negative tests, and independent-review
  plan.
- The root creates a separate implementation card only after those records are
  committed and independently reviewed. M34-T010 never moves to ready or
  active and never authorizes implementation itself.

## Acceptance

Accepted at 2026-09-08T10:53:22Z after the human supplied the complete
secret-free configuration packet and then explicitly selected the compatible
`REG_S / NONE` amendment. The accepted decision is recorded in
[HA-ATS-CONFIGURATION-001](../../evidence/HA-ATS-CONFIGURATION-001-decision.md)
and an independent review is recorded in
[M34-T010 configuration review](../../evidence/M34-T010-configuration-review.md).

The review independently confirmed the exact package integrity, compatible
request shape, amended canonical preimage hash, synthetic issuer boundary,
explicit M20 non-binding declaration, and continued zero-enabled M33 state.
M34-T010 closes without entering ready or active. It authorizes no source work
by itself; only a separately recorded local unsigned successor may begin its
own specification, RED, GREEN, and review cycle.
