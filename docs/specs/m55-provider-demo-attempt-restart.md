# M55 — Deploy another provider tool

## Outcome and authority

An authorized provider can deploy another tool without altering an earlier
tool. The new tool may have **exactly the same prefilled information, including
its name**. Identity, ownership, deployment evidence, and Directory publication
distinguish the tools; content does not.

This refines repository issue #93.
The owner's September 12 clarification supersedes its original user-facing
“demo attempt” proposal. The filename remains for reference compatibility.
**Deploy a new tool** is the action; M55 adds neither a reset control nor an
attempt-history product.

This specifies intended behavior, not current runtime behavior. Read the
[handoff](../work-queue/evidence/M55-T010-delegation.md) and
[implementation plan](../superpowers/plans/2026-09-12-m55-deploy-another-tool.md).
Refinement does not activate source ownership or authorize wallet use, signing,
authority provisioning, transactions, or environment deployment.

## Product scope

- One provider may own multiple tools. M55 gives each new tool one initial
  offering/campaign (version 1) and the existing technical ATS preparation/
  receipt lifecycle. Multiple campaigns per tool are outside this slice.
- **Resume deployment** continues a selected unfinished tool; **View
  deployment** opens a deployed tool; **Deploy a new tool** creates a different
  tool, including when the current one is OPEN.
- “Deploy” retains the current stages: signed offering creation, signed
  preparation, human-controlled ATS deployment and signed candidate attachment,
  then signed Directory publication. It does not host new service code or
  implement an arbitrary capability or x402 execution API.
- Keep the supported RiskScan profile and editable prefilled fields. Reusing
  capability, resource, endpoint, prices, and name is allowed. Renaming the
  profile must not imply new service functionality. ATS economics remain the
  approved technical template; retain the visible
  `m20EconomicsBinding = NONE` limitation during review.
- Sandbox onboarding and enabling more issuer wallets are separate work.
  A dashboard session alone is not issuer authority.

## UI and routing

1. Put **Deploy a new tool** on the authenticated dashboard's tool list, the
   Provider status page (including OPEN/CLOSED), and the selected deploy wizard.
   Reuse existing components/style, not the mockup's unrelated fields/network.
2. Confirmation: **Deploy a new tool?** Body: **A separate tool will be created
   with prefilled details you can edit. Your existing tools and deployments
   remain unchanged.** Actions: **Keep current tool** and **Create new tool**.
   Add: **Deployment requires new signatures and testnet transaction fees.**
   Trap/restore focus; Escape/Cancel performs no write. Unsigned users follow
   existing sign-in; opening the dialog or signing in does not allocate.
3. Confirmation sends one authenticated allocation request. Disable duplicate
   confirmation while pending. Success navigates to
   `/provider/deploy?tool=<toolPublicId>` at the prefilled first step.
   Header: **Deploy your tool**; summary shows name plus short immutable ID.
4. Generate one request ID per explicit creation intent. Retain only an
   unresolved request ID in session storage; no wallet, signature, session,
   candidate, or authorization material. A lost response offers **Retry
   creation** with that same ID. Reload may show retry but never POST
   automatically. A later intentional creation generates a new request ID.
5. GET, refresh, wallet events, and resume reads allocate nothing. ALLOCATED
   reloads the selected tool's default editable form; unsaved field edits are
   not durable. After Stage 1 restore and lock the signed offering fields.
   DRAFT resumes before preparation, ASSET_PENDING resumes its bound attempt,
   READY offers publication, OPEN/CLOSED links to
   `/provider?tool=<toolPublicId>`.
6. Preserve unparameterized legacy routes. Unparameterized
   `/provider/deploy` may offer legacy continuation and new-tool creation;
   never choose a latest tool or allocate implicitly. Invalid/foreign selected
   IDs fail closed without fallback to RiskScan. Changing wallet/tool discards
   stale results, candidates, execution configuration, and async responses.
7. The authenticated dashboard lists its owner's tools with pagination (20 per
   page, maximum 50), name, short ID, status, and Resume/View links. Include the
   owned legacy offering through a read-only compatibility projection.
   Same-name tools remain distinguishable; private drafts are owner-only.

## Identity and storage

Add a durable `providerTools` ownership/allocation record. Generate
128 random bits server-side, rendered as 32 lowercase hex characters `id`:

```text
toolPublicId      = tool_<id>
subjectPublicId   = tool_<id>
offeringPublicId  = offering_<id>
serviceId        = tool_<id>
serviceSlug      = tool-<id>
offeringVersion  = 1
directoryVersion = 1
```

Bind these identities to chain 296, canonical signer, principal, authority
version, request ID, and server allocation time. Index tool ID, offering ID,
signer/chain, and signer/chain/request ID. Transactionally check request
idempotency and identity collisions. Equal form values are not unique keys.
Accept no caller-supplied identity, owner, principal, authority version, or hash.

Allocation inserts only this record: no offering, prepared attempt, asset,
signature, listing, or authority. Derive ALLOCATED from the absence of the
matching offering; keep existing offering/attempt state machines instead of
duplicating deployment state in the tool row.

### Authorization decision

- `POST /api/provider/tools` accepts exactly `{requestId}` (UUID v4,
  maximum 1 KiB JSON). Require the existing sealed dashboard session, configured
  cookie name, and exact configured Origin. Derive owner from the session.
  Missing/invalid authentication or cross-origin input returns 401/403 before
  any backend call.
- Next sends a short-lived HMAC-authenticated session assertion to a separate
  `/internal/provider-tools` endpoint. Its closed body binds verified
  session address/expiry and operation allocate/list/read with their arguments.
  This is a server assertion, not a wallet-signed command.
- Reuse the existing ingress key registry and audited low-level HMAC-SHA256
  primitives, with this distinct signing input:

```text
tool402:provider-session:v1\nPOST\n/internal/provider-tools\n<timestampSeconds>\n<nonce>\n<sha256(rawBody)>
```

- Verify exact path/method/protocol, body hash, enabled key, maximum 60-second
  clock skew, unexpired asserted session, and nonce replay before dispatch.
  Preserve the current `/internal/commands` envelope and relay:
  they must not mint/forward assertions for this new domain. Do not generalize
  them into an arbitrary-destination relay. Bound internal requests to 4 KiB,
  responses to 64 KiB, timeout to 10 seconds; no-store and no redirects.
- Allocation requires exactly one current enabled ISSUER authority matching
  the signer/principal/authority version of the approved Stage-B issuer
  template and its existing legacy-subject permission. Sandbox ISSUER/BACKER,
  missing, duplicated, revoked, or replaced authority rejects without insertion.
- Resolve new-subject ownership from its allocated tool and the current
  authority. Do not create an issuer, grant a wildcard, or append an unbounded
  owned-subject array. Resolve only the selected command subject and repeat
  that check transactionally in every advancing write and replay branch.
  Neither a known ID nor dashboard authentication replaces a stage signature.
- Same signer/chain/request ID returns the same allocation after current
  authority revalidation, including concurrent requests. A new intent returns
  a different tool. No automatic deletion, cleanup, or backfill is included.
- Protected list/read operations verify session ownership, use bounded indexed
  pagination, and expose safe identities/statuses only. An owner may inspect
  existing tools after issuer revocation, but cannot allocate/advance them.
  Never expose internal IDs, principal, authority version, signatures, secrets,
  or another owner's unsigned draft.

The protected selected-tool read supplies the owner's offering/preparation
projection for resume. New-tool ALLOCATED/DRAFT/ASSET_PENDING/READY records are
not available through public offering/Directory endpoints. Public new-tool
reads become available only after publication (OPEN/CLOSED). Keep legacy
public projections compatible rather than silently making their data private.

## Stage and ATS binding

Stage 1 binds the allocated offering ID/version and subject to its currently
authorized owner; accepted signed fields are immutable in this flow. Stage 2
selects exactly that tool's DRAFT by subject/owner/principal/authority version,
not by name or an arbitrary draft. Preparation keys remain per preparation.

For new tools, derive configuration server-side from the admitted offering,
allocated subject, and approved issuer. Preserve Factory, resolver, chain, SDK
provenance, flags, symbol, ISIN, dates, and economics. Only these preimage
values vary:

```text
subjectPublicId = allocated subjectPublicId
parameters.name = admitted offering.narrative.title
parameters.info = "Tool402 testnet demo revenue note; no real-world investment or return claim. Tool ID: " + toolPublicId
```

Apply the existing signed-title bound. Keep diamond owner and sole default
admin equal to the approved issuer, not a caller-selected account. Recompute
the eleven-field JCS/Keccak hash per tool; the new-path hash is derived, not a
new transcribed constant. Preserve legacy RiskScan preimage/digest/projection.

Return validated selected-tool command, execution, and display projections
after Stage 1, containing only allowlisted public deployment values, not
authority metadata. Backend preparation and verification independently derive
and compare the same configuration. Browser values are not server authority.

The ID enters Factory calldata through `parameters.info`. Two equal names
must produce different hashes **and different calldata**. A subject-specific
hash with identical calldata does not distinguish actual deployments.

### Receipt checks required for new tools

The current browser receipt checks plus signed attachment are insufficient
for multi-tool binding. A's deployment must never make B READY.

1. Explicit browser execution/recovery verifies network, successful receipt,
   transaction hash, sender, Factory, exact selected-tool input, and exactly
   one valid Factory BondDeployed address; unrelated logs are allowed.
2. Signed attachment triggers independent server corroboration through the
   fixed trusted testnet reader, never a client URL or supplied receipt. Bound
   transaction/receipt responses and timeouts; this action performs reads only.
3. A final internal mutation revalidates current owner/authority, preparation,
   configuration, signature/replay context, and offering after the read.
   Atomically reject a canonical transaction hash **or** asset already bound
   to another offering, including legacy records. Add indexed durable receipt
   bindings for concurrency and indexed legacy checks; aliases must resolve to
   the canonical EVM hash. Same-offering exact replay remains idempotent.
   Apply the shared exclusivity guard in **every** attachment and READY
   replay-repair write, including the legacy path. Checking legacy rows only
   when a new tool writes is insufficient: a later or concurrent legacy write
   must also reject an asset/hash claimed by a new tool. Preserve already
   admitted legacy rows and legitimate same-offering replays; this guard
   narrowly supersedes historical acceptance of conflicting legacy writes.
4. Only corroborated new-tool attachment advances to READY. Unavailable or
   ambiguous evidence leaves it pending. Retain recovery context; say
   attachment was not accepted, not that no deployment happened. Existing
   closed relay outcomes may remain. Verification retry is explicit and never
   resends a transaction. All replay paths enforce these checks.

The existing HEDERA_FUNDING verifier is not ATS_CREATE proof. Preserve its
behavior and legacy records when adding this new-tool path.

## Directory and execution-service boundary

- New records use the selected offering and allocated service identity.
  Accept legacy `riskscan` plus canonical `tool-<id>` slugs;
  require the generated slug/service ID to match the allocated tool. Keep
  capability and payment validators closed to the supported profile.
- Enforce one ACTIVE version **per service identity**, not globally per
  RiskScan template. Publishing B must not supersede A or legacy RiskScan.
  Selected projections must match offering, service, and version throughout;
  never pair offering B with the fixed RiskScan Directory response.
- Preserve existing legacy API/Explore behavior. Separate readable Directory
  records and Provider links are required, not a public catalogue redesign or
  modification of static consumer descriptors.
- Authentication origin and hosted endpoint are distinct. Introduce explicit
  server configuration `TOOL402_PROVIDER_X402_ENDPOINT` (HTTPS, no
  credentials/fragment); fall back to the existing HTTPS-origin-derived
  RiskScan endpoint only when valid. HTTP localhost auth with no valid endpoint
  leaves publication not configured; never force HTTPS login, invent a URL, or
  silently publish an invalid endpoint. Clearing-account validation remains.

## Compatibility and exclusions

For allocated new tools only, M55 supersedes fixed-subject/name/hash selection
in [M42](m42-ats-create-configuration-retarget.md),
[M47](m47-ats-stage-b-runtime-binding.md), and
[M49](m49-stage-b-browser-provider-bridge.md), corresponding M44 Factory/M48
template restrictions, fixed-offering presentation in
[M51](m51-provider-durable-campaign-resume.md) and
[S42](s42-dashboard-campaign-continuation.md), and global single-RiskScan
Directory identity. Preserve legacy provenance/safety assertions and test both
paths rather than deleting historical coverage.

Schema changes admit existing documents unchanged. No reset, backfill,
authority re-enablement, environment mutation, package upgrade, mainnet,
additional ATS operation, arbitrary service hosting, ownership transfer,
second campaign per tool, automatic transaction retry, or live action is
authorized by this refinement. Local development stays HTTP localhost:3000
with genuine dashboard sign-in and verified environment under root AGENTS.md.

## Acceptance matrix

| ID | Scenario | Required result |
| --- | --- | --- |
| A1 | Existing legacy OPEN tool, explicit new-tool confirmation | New identity, first form step; old offering/asset/Directory unchanged. |
| A2 | Two creations with all prefilled fields unchanged | Different tool/subject/offering/slug/hash/calldata/receipt bindings; equal names allowed; both OPEN and visible after separately authorized deployments. |
| A3 | Double click, concurrent same ID, lost response | One allocation; explicit same-ID retry returns it; later intentional creation returns another. |
| A4 | Refresh/direct link/back/wallet event | No allocation/signature/relay/send; restore only selected durable facts. |
| A5 | Invalid session, foreign owner, sandbox/BACKER, revoked/duplicate/stale authority | No allocation/advancement; owner's history readable after revocation. |
| A6 | Forged/cross-domain/stale/replayed session assertion | Reject before allocation; ordinary command relay cannot manufacture this assertion. |
| A7 | A and B both DRAFT/ASSET_PENDING | B prepare links only B; altered IDs/configuration/replay cannot advance A. |
| A8 | A's receipt for B; new-first→legacy, legacy-first→new, and concurrent asset/hash claims | No cross-offering binding in any write/replay branch; exact rightful replay remains idempotent. |
| A9 | Wrong sender/chain/Factory/input/logs; unavailable reader | Pending/explicit failure; no false success or automatic transaction resend. |
| A10 | B publishes after A | Separately ACTIVE identities; projections never mix evidence; legacy links work. |
| A11 | Wallet/tool changes during asynchronous work | Discard stale reads, signature results, configuration, and candidates. |
| A12 | Pagination, keyboard/mobile, HTTP auth, missing service endpoint | Owned list/focus correct; genuine sign-in; explicit config failure without auth bypass. |

Automated/injected tests prove local behavior; browser evidence proves real
routes/authentication/presentation; separately authorized testnet evidence
proves two actual deployments. A docs commit, queue check, or mock receipt is
not live acceptance of A2.
