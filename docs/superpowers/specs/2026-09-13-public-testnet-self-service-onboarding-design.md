# Public testnet self-service onboarding design

## Decision

Tool402 adds a **disabled-by-default public Hedera Testnet self-service
policy**. A wallet that has completed the existing dashboard MetaMask
authentication may be provisioned as a limited self-service account. It can
create and operate only its own provider tools and can back an eligible OPEN
tool owned by somebody else. It does not receive legacy ATS administration,
issuance, transfer, payout, x402, or mainnet authority.

This supersedes the historical per-wallet manual activation restriction only
for the new self-service flows. Existing RiskScan and manually provisioned
authorities remain unchanged.

## Chosen model

Do not add a second `commandAuthorities` row for a wallet: current readers
correctly reject ambiguous rows. Instead, add one server-owned
`selfServiceAccounts` membership, keyed by canonical lower-case address and
chain 296. Its stable, server-derived principal and `public_testnet_v1` policy
version never change on normal sign-in. Its status is `ACTIVE`, `SUSPENDED`,
or `REVOKED`; only an operator-controlled mutation may change it.

The authenticated Next-to-Convex ingress provisions that membership
atomically and idempotently from a verified dashboard session. It accepts no
owner, role, version, or capability supplied by the browser. Dashboard sign-in
itself remains available for legacy users: the first protected self-service
dashboard/provider/backer read performs the ensure after the session is set.
It returns an explicit unavailable result when the feature flag or backend
configuration is absent. Existing sessions invoke the same server assertion
before a new self-service write, so they are not required to sign in again. A
suspended or revoked row is never recreated or silently reactivated.

Command admission resolves the requested capability and durable target. A
compatible legacy authority keeps its original principal/version; an
incompatible or disabled legacy row neither masks an eligible self-service
membership nor becomes enabled. The selected command and durable mutation
both enforce the same scoped capability:

- create, edit, prepare ATS, attach a candidate, and publish require the
  selected tool's durable owner;
- `HEDERA_FUNDING` requires an active self-service backer, a public OPEN
  offering, server-derived terms, and a different offering owner;
- protected tool and backing reads are scoped to their corresponding owner or
  backer.

No role field, subject, recipient, amount, principal, or policy version from a
wallet command grants authority. Legacy rows retain their exact interpretation.

## Provider and ATS flow

M55's generated tool identity remains the identity boundary. Allocation
creates no offering, signature, transaction, or funding record. The signed
provider pipeline then derives issuer, asset owner, default administrator,
ATS configuration, canonical digest, and receipt expectation from the
selected tool and its durable owner. The browser receives only an allowlisted
projection.

The legacy RiskScan configuration stays byte-compatible. New tools use the
approved Factory, Resolver, ABI, network 296, and constrained template fields;
they never accept arbitrary calldata or admin addresses. Before enabling the
new execution projection, tests and a read-only official-artifact/simulation
check must establish that the Factory permits this caller model. A database
permission never substitutes for an on-chain permission.

Candidate attachment and receipt confirmation reconstruct the expected
tool/owner configuration, preserve the existing exclusive transaction and
asset bindings, and retain reload recovery. The owned-tool Recheck request
invokes the bounded receipt verifier for that exact submitted attempt before
returning its updated projection; it never resubmits a wallet transaction or
authorizes a new deployment.

## Backing flow

The server-owned backing projection becomes offering-scoped while keeping the
legacy RiskScan URL and treasury policy. A public self-service offering becomes
discoverable only after verified publication. Its explicit recipient policy is
the verified tool owner's canonical wallet, persisted with the published
offering. Preparing a backing attempt freezes offering version, terms,
recipient, signer, and exact BigInt tinybar amount. Draft and closed offerings,
forged terms, self-transfers, and a changed recipient are rejected.

M58's reservation, unique hash claim, idempotent attachment, verifier, and
recovery semantics apply per attempt. Payment dispatch has durable distinct
states: reserved-not-started, dispatch-started-with-unknown-outcome,
submitted-hash, and terminal verified outcome. Starting dispatch is an atomic,
single-use claim: a reservation replay never becomes a second Send permit.
Missing browser storage or a missing hash is not proof that dispatch did not
start. Explicit wallet rejection and pre-dispatch insufficient balance may
return to a controlled unsent state; an ambiguous invocation cannot. The
server rechecks current OPEN eligibility and the exact frozen
version/terms/recipient immediately before a new dispatch, while submitted
historical receipts remain reconcilable after closure, suspension, or flag
disablement. A confirmed HBAR transfer is payment evidence only; it does not
allocate an ATS asset.

## Operations and user experience

The backend feature flag `TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED` is
false unless explicitly enabled. Server-enforced limits
`TOOL402_SELF_SERVICE_MAX_TOOLS` and
`TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS` bound new activity; durable,
server-clocked rate-limit records prevent page refresh from resetting abuse
limits. Disabling the flag blocks new writes but leaves history, receipt
reconciliation, and safe owner/backer reads available. Operator suspension is
durable and likewise preserves history.

The UI preserves the current explicit signatures and MetaMask confirmations.
It offers a verified testnet faucet link, shows both **Your tools** and **Your
backing**, returns to the intended destination after sign-in, and rechecks the
matching account and chain immediately before each wallet action. Session,
network, balance, backend, receipt, and account-change failures are explicit;
recovery never sends again.

## Migration, rollout, and proof

No existing `commandAuthorities`, provider tools, offerings, attempts, or
RiskScan records are rewritten. New tables/indexes are additive. Rollout is:
deploy schema and code with the flag false; configure ingress and limits;
exercise the two-wallet acceptance checklist in a controlled testnet
environment; then enable the flag. Rollback sets the flag false and optionally
suspends selected accounts, without deleting attempts or evidence.

Automated tests use independent A/B non-Guillaume identities for onboarding,
concurrency, ownership isolation, provider-plus-backer capability, funding
eligibility, tampered inputs, account/session mismatch, revocation, recovery,
hash uniqueness, limits, flag-off behavior, and legacy compatibility. Local
tests and browser checks are not claimed as live testnet wallet proof.
