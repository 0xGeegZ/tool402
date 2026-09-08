# HA-ATS-LIVE-AUTHORITY-001 — Recommended staged human decision

> Status: REQUIRED — not approved. This is a secret-free decision packet only.
> It does not authorize an SDK import or call, Convex publication, a provider
> or wallet interaction, account action, funding, payment, transaction, asset,
> deployment, or live-success claim.

## Why this requires a human decision

M35 intentionally binds its configuration to the synthetic non-executable
issuer 0x0000000000000000000000000000000402. Its canonical issuer field and
its diamond owner field use that same value. The accepted M35 authority
expressly forbids using that value in a live transaction or an enabled M33
record.

A real issuer changes the RFC8785-JCS preimage and therefore requires a new
independently recomputed canonical parameters hash. M33 remains zero-enabled,
and M32 has no authority-provisioning writer or BFF/HTTP adapter. The root
must not infer the issuer, command-authority record, parameter hash, or a live
execution permission from the unsigned local projection.

## Recommended safest D-Day option

Approve the two stages below separately.

1. Stage A authorizes exactly one reviewed source-only testnet ATS_CREATE
   authority binding. It may allow a separately scoped local card to add one
   reviewed M33 mapping and tests using a new real-issuer preimage and hash.
   It must not publish, provision a command-authority row, import or initialize
   the SDK, connect a provider, prompt a wallet, or create an asset.
2. Stage B is a later one-shot live GO after Stage A is reviewed and accepted.
   It alone may authorize Human Ops, never the root agent, to provision the
   exact current authority row, publish the reviewed source, use the selected
   wallet, attempt at most one ATS_CREATE testnet execution, and return
   redacted receipt/finality evidence. Failure is outcome-unknown and has no
   automatic retry.

## Stage A — prefilled proposed rules

The human must accept every candidate below verbatim or explicitly replace it.
There are no implicit defaults.

| Field | Proposed value |
| --- | --- |
| Network | hedera:testnet |
| EVM chain ID | 296 |
| Operation | ATS_CREATE only |
| Target kind | EVM_ADDRESS |
| Factory target | 0x5fa65ca30d1984701f10476664327f97c864a9d3 |
| Factory Hedera ID | 0.0.7708432 |
| Resolver EVM address | 0xefef4cae9642631cfc6d997d6207ee48fa78fe42 |
| Resolver Hedera ID | 0.0.7707874 |
| SDK candidate | @hashgraph/asset-tokenization-sdk@8.0.0 |
| SDK integrity candidate | sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA== |
| Creation family | BOND_STANDARD using CreateBondRequest and Bond.create |
| Subject | riskscan_revenue_note_demo |
| Offering version | ats_demo_v1 |
| Registry revision | ats_sdk_8_0_0_testnet_v1 |
| Recommended principalPublicId | tool402_ats_issuer_testnet_v1 |
| Role | ISSUER |
| Recommended authorityVersion | ats_issuer_testnet_v1 |
| Recommended ownedSubjectPublicIds | [riskscan_revenue_note_demo] |

The actual dedicated Human Ops Hedera-testnet MetaMask issuer address is the
only identity value not knowable to the root. The human must supply it in
canonical lowercase 0x plus 40 hexadecimal characters and attest that Human
Ops controls it. No private key, seed phrase, signature, wallet export, or
credential may be supplied or committed.

The selected real address must be substituted as diamondOwnerAccount. The
human must explicitly re-adopt or replace every other immutable descriptor and
parameter from M35, including name, symbol, ISIN, supply, dates, whitelist,
omitted optional fields, regulation pair, and explicit M20 non-binding
declaration. The root must recompute a new full JCS/Keccak preimage and hash;
the M35 hash eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f
must never be enabled.

The planned current command-authority record is exactly:

    chainId: 296
    canonicalSignerAddress: <actual approved issuer>
    principalPublicId: <accepted exact value>
    role: ISSUER
    ownedSubjectPublicIds: <accepted exact array>
    authorityVersion: <accepted exact value>
    enabled: true

This describes the authority that a later Human Ops-only provisioning step
must establish. Stage A creates no row and no agent may provision it.

## Stage A explicit non-authorizations

Stage A does not authorize M32 durable state, Convex publication, SDK
import/init/request construction/call, provider or MetaMask connection, wallet
signature, account creation or funding, payment, transaction, asset, holder
or compliance action, clearing, HCS, payout, deployment, or live evidence.
ATS_CONTROL_LIST, ATS_ISSUE, ATS_TRANSFER, and ATS_COUPON remain fail-closed.

## Stage B future live GO

After a reviewed Stage A source head, a separate decision must name the exact
Human Ops provisioning method for one authority row, the environment to which
the reviewed source may be published, the selected wallet and fixed chain,
the one permitted SDK call, the one permitted testnet transaction, receipt and
finality evidence requirements, stop conditions, and no-retry handling. It
must not be inferred from this packet.

## Explicit human declaration

Decision owner: 0xGeegZ

Decision timestamp: [supply when approving]

Declaration:

    I approve Stage A exactly as completed above for one source-only,
    real-issuer ATS_CREATE authority binding. I reject all implicit defaults
    and authorize no Stage B action, SDK/provider use, authority provisioning,
    wallet action, funding, transaction, deployment, or live claim.

## Root intake checklist

The root accepts this packet only after the actual issuer, each immutable
parameter, exact new canonical hash, and exact command-authority values are
concrete, mutually consistent, secret-free, and independently reviewed. Until
then M36 remains an inbox control record and no implementation card may enter
ready or active.
